import cv2
import torch
import numpy as np
from PIL import Image
from diffusers import StableDiffusionXLInstantIDPipeline, ControlNetModel, AutoencoderKL
from diffusers.utils import load_image
from insightface.app import FaceAnalysis
import os

class LocalInstantIDPipeline:
    def __init__(self, model_id="wangqixun/YamerMIX_v8", adapter_path="InstantX/InstantID"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.torch_dtype = torch.float16 if self.device == "cuda" else torch.float32
        
        print(f"Initializing Local Pipeline on {self.device}...")

        # 1. Load InsightFace (Face Analysis)
        # Ensure you have 'antelopev2' models in ~/.insightface/models/ or configured path
        self.app = FaceAnalysis(name='antelopev2', root='./', providers=['CUDAExecutionProvider', 'CPUExecutionProvider'])
        self.app.prepare(ctx_id=0, det_size=(640, 640))

        # 2. Load ControlNet (IdentityNet)
        controlnet_path = "InstantX/InstantID"
        self.controlnet = ControlNetModel.from_pretrained(
            controlnet_path, 
            subfolder="controlnet", 
            torch_dtype=self.torch_dtype
        )

        # 3. Load Main Pipeline (SDXL)
        self.pipe = StableDiffusionXLInstantIDPipeline.from_pretrained(
            model_id,
            controlnet=self.controlnet,
            torch_dtype=self.torch_dtype
        )
        self.pipe.to(self.device)
        
        # 4. Load IP-Adapter (InstantID specific)
        self.pipe.load_ip_adapter_instantid(adapter_path)
        
        print("Pipeline Loaded Successfully!")

    def get_face_embedding(self, image_np):
        """Extract face embed using InsightFace"""
        face_info = self.app.get(image_np)
        if len(face_info) == 0:
            return None, None
        
        # Sort by size, use largest face
        face_info = sorted(face_info, key=lambda x: (x.bbox[2]-x.bbox[0]) * (x.bbox[3]-x.bbox[1]), reverse=True)
        face = face_info[0]
        return face, face.kps

    def generate(self, image_path: str, prompt: str, negative_prompt: str, style_name: str = None):
        # Read image
        image = load_image(image_path)
        image_np = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Get Face Info
        face_info, face_kps = self.get_face_embedding(image_np)
        
        if face_info is None:
            raise ValueError("No face detected in the image!")

        # Generate
        # Parameters often need tuning
        image = self.pipe(
            prompt=prompt,
            negative_prompt=negative_prompt,
            image_embeds=face_info.normed_embedding,
            image=image, # Reference image for structure control (optional but good for specific styles)
            controlnet_conditioning_scale=0.8,
            ip_adapter_scale=0.8,
            num_inference_steps=30,
            guidance_scale=5,
        ).images[0]

        return image

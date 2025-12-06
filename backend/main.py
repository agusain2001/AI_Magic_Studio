import os
import io
import replicate
from fastapi import FastAPI, UploadFile, File, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "service": "AI Photo Personalisation Backend"}

@app.post("/generate")
async def generate_image(
    file: UploadFile = File(...),
    x_replicate_token: str = Header(..., alias="X-Replicate-Token")
):
    if not x_replicate_token:
        raise HTTPException(status_code=401, detail="Replicate API Token required in header 'X-Replicate-Token'")
        
    try:
        # Read file content
        content = await file.read()
        
        # Initialize client with user provided token
        client = replicate.Client(api_token=x_replicate_token)
        
        # Prepare inputs for InstantID
        # Using a popular robust InstantID model
        # instantx/instant-id
        
        # We need to save the file temporarily or pass as bytes. 
        # Replicate client accepts a file-like object.
        file_obj = io.BytesIO(content)
        
        # Using a specific version to ensure stability
        # instantx/instant-id:c645ba5469f3d9c1584c5011933ac84f7678d9494294b413c6e917651a25bd83
        
        output = client.run(
            "instantx/instant-id:c645ba5469f3d9c1584c5011933ac84f7678d9494294b413c6e917651a25bd83",
            input={
                "image": file_obj,
                "prompt": "illustration of a child, soft lighting, detailed face, artstation style, disney style, 3d render, cute",
                "negative_prompt": "text, watermark, low quality, blurred, deformed, ugly",
                "style_name": "3D Render", # or other styles supported by the model
                "num_inference_steps": 30,
                "guidance_scale": 5
            }
        )
        
        # Output is a list of URLs
        if output and len(output) > 0:
            return {"status": "success", "image_url": output[0]}
        else:
            raise HTTPException(status_code=500, detail="No output generated from Replicate")
            
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

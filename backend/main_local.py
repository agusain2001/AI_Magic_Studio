import io
import base64
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Import our local pipeline class
# Note: This requires the dependencies in requirements_local.txt to be installed
try:
    from pipeline_local import LocalInstantIDPipeline
except ImportError:
    print("Warning: Local Pipeline dependencies not found. Please install requirements_local.txt")
    LocalInstantIDPipeline = None

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global pipeline variable
pipeline = None

@app.on_event("startup")
async def startup_event():
    global pipeline
    if LocalInstantIDPipeline:
        try:
            # Initialize pipeline (this loads heavy models into VRAM)
            # You might want to make prompt/negative_prompt configurable via env vars or request
            pipeline = LocalInstantIDPipeline()
        except Exception as e:
            print(f"Failed to load pipeline: {e}")
    else:
        print("Pipeline class not available.")

@app.get("/")
def read_root():
    return {"status": "ok", "service": "AI Photo Personalisation (Local GPU)"}

@app.post("/generate")
async def generate_image(
    file: UploadFile = File(...),
    prompt: str = "illustration of a child, soft lighting, detailed face, artstation style, disney style, 3d render, cute",
    style: str = "3D Render"
):
    global pipeline
    if not pipeline:
         raise HTTPException(status_code=503, detail="AI Pipeline is not loaded. Check server logs.")

    try:
        # Read file content
        content = await file.read()
        
        # Save temporarily (InsightFace needs path or cv2 image)
        # Using temp file approach for safety with various libraries
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        
        # Generate
        # Returns PIL Image
        result_image = pipeline.generate(
            image_path=tmp_path, 
            prompt=prompt, 
            negative_prompt="text, watermark, low quality, blurred, deformed, ugly"
        )
        
        # Cleanup temp file
        os.remove(tmp_path)
        
        if result_image:
            # Convert to Base64 to send back to frontend
            buffered = io.BytesIO()
            result_image.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
            
            # Format as Data URL
            data_url = f"data:image/png;base64,{img_str}"
            
            return {"status": "success", "result": [data_url]} # Match frontend expectation array or single
        else:
            raise HTTPException(status_code=500, detail="Generation failed to produce an image")
            
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

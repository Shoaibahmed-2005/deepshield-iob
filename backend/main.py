from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import numpy as np

load_dotenv()

from database import engine
import models

models.Base.metadata.create_all(bind=engine)

from routes import auth, transactions, vidlive


# ── Deepfake detector — lightweight CPU-only ONNX ─────────────────────────────
#
# Model : prithivMLmods/Deepfake-Detection-Exp-02-22-ONNX
# File  : onnx/model_int8.onnx  (INT8 quantised ViT-B/32, ~85 MB)
# Engine: onnxruntime (CPU-only, no CUDA / PyTorch / TensorFlow)
#
# First run  : downloads ~85 MB to HuggingFace cache then loads instantly.
# Subsequent : loads from cache in < 1 second.
#
# Labels : {"0": "Deepfake", "1": "Real"}
# Preprocessing: resize 224×224, normalize to [-1, 1] (ViT standard)


class _DeepfakeONNXDetector:
    """
    Runs the Deepfake-Detection-Exp-02-22 ViT model via onnxruntime.

    Input : PIL.Image (any size — resized + normalised internally)
    Output: [{"label": "Real"|"Deepfake", "score": float}, ...]
            sorted highest-confidence first — matches HuggingFace pipeline format.
    """

    _LABELS = {0: "Deepfake", 1: "Real"}

    def __init__(self, onnx_path: str):
        import onnxruntime as ort
        self._session = ort.InferenceSession(
            onnx_path,
            providers=["CPUExecutionProvider"],
        )
        self._input_name = self._session.get_inputs()[0].name   # "pixel_values"

    @staticmethod
    def _softmax(x: np.ndarray) -> np.ndarray:
        e = np.exp(x - x.max())
        return e / e.sum()

    def __call__(self, image):
        """
        image: PIL.Image.Image
        Returns list-of-dicts sorted by confidence descending.
        """
        img = image.convert("RGB").resize((224, 224))
        arr = np.array(img, dtype=np.float32) / 255.0        # 0 → 1
        arr = (arr - 0.5) / 0.5                               # -1 → 1  (ViT norm)
        arr = arr.transpose(2, 0, 1)[np.newaxis]              # NCHW [1,3,224,224]

        logits = self._session.run(
            None, {self._input_name: arr}
        )[0][0]                                               # shape [2]

        probs = self._softmax(logits)
        results = [
            {"label": self._LABELS[i], "score": float(probs[i])}
            for i in range(len(self._LABELS))
        ]
        return sorted(results, key=lambda x: x["score"], reverse=True)


def _load_deepfake_detector():
    """
    Download (first run) and instantiate the ONNX detector.
    Returns the detector callable, or None if anything fails.
    """
    try:
        from huggingface_hub import hf_hub_download

        print(
            "Loading deepfake detector: "
            "prithivMLmods/Deepfake-Detection-Exp-02-22-ONNX (INT8 ONNX) …"
        )
        onnx_path = hf_hub_download(
            repo_id="prithivMLmods/Deepfake-Detection-Exp-02-22-ONNX",
            filename="onnx/model_int8.onnx",
        )
        detector = _DeepfakeONNXDetector(onnx_path)
        print("Deepfake model ready — CPU inference, no GPU required.")
        return detector

    except ImportError as exc:
        print(f"INFO: {exc}")
        print("      pip install onnxruntime  to enable real deepfake detection.")
    except Exception as exc:
        print(f"WARNING: Could not load deepfake model ({exc}).")

    print("VID-LIVE running in simulation mode (realistic randomised scores).")
    return None


_deepfake_detector = _load_deepfake_detector()
vidlive.deepfake_detector = _deepfake_detector


# ── FastAPI app ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="VID-LIVE API",
    description="Indian Overseas Bank — VID-LIVE deepfake-resilient authentication",
    version="2.0.0",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
# Regex allows any localhost port so Vite's auto-port-bump never breaks CORS.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(vidlive.router)


@app.get("/")
def root():
    return {
        "service": "VID-LIVE API",
        "bank": "Indian Overseas Bank",
        "status": "running",
        "version": "2.0.0",
        "deepfake_model": "loaded" if _deepfake_detector else "simulation",
    }


@app.get("/health")
def health():
    return {"status": "ok", "deepfake_model": bool(_deepfake_detector)}

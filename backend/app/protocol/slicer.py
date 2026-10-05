"""
OOK Slicer for SemLiFi optical receiver.
Documented experimental ADC ranges (Section IV-C):
- Dark level: ~0 to 5 ADC counts
- Illuminated level: ~95 to 176 ADC counts
- Decision threshold: ~50 ADC counts
Mid-bit sampling window: 450 µs to 550 µs of each half-bit chip interval.
"""

from typing import List
from pydantic import BaseModel

class SignalSample(BaseModel):
    time_us: int
    adc_value: float
    sliced_bit: int  # 0 or 1
    state: str       # "LIGHT DETECTED", "BLOCKED", "NO SIGNAL", "UNKNOWN"

class SlicerConfig(BaseModel):
    threshold: float = 50.0
    dark_baseline: float = 2.5
    illuminated_nominal: float = 135.0
    bit_period_us: int = 1000
    chip_period_us: int = 500
    mid_bit_start_pct: float = 0.45
    mid_bit_end_pct: float = 0.55

def slice_adc_sample(adc_value: float, threshold: float = 50.0) -> int:
    """Slices a raw ADC count to digital 1 or 0."""
    return 1 if adc_value >= threshold else 0

def classify_signal_state(adc_value: float, threshold: float = 50.0) -> str:
    """Classifies physical optical channel state based on documented ADC count."""
    if adc_value >= threshold:
        return "LIGHT DETECTED"
    elif adc_value < 15.0:
        return "BLOCKED"
    elif adc_value < threshold:
        return "NO SIGNAL"
    return "UNKNOWN"

def slice_waveform(adc_samples: List[float], threshold: float = 50.0) -> List[int]:
    """Slices an array of ADC samples to digital chips."""
    return [slice_adc_sample(v, threshold) for v in adc_samples]

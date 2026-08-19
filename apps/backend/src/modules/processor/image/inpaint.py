#!/usr/bin/env python3
"""OpenCV image watermark-region processing, called only with validated normalized regions."""
import argparse
import json
import sys

import cv2
import numpy as np


def region_to_pixels(region, width, height):
    x = max(0, min(width - 1, round(region["x"] * width)))
    y = max(0, min(height - 1, round(region["y"] * height)))
    right = max(x + 1, min(width, round((region["x"] + region["width"]) * width)))
    bottom = max(y + 1, min(height, round((region["y"] + region["height"]) * height)))
    return x, y, right - x, bottom - y


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--regions", required=True)
    parser.add_argument("--mode", choices=["inpaint", "blur"], default="inpaint")
    args = parser.parse_args()

    image = cv2.imread(args.input, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Input is not a readable image")
    regions = json.loads(args.regions)
    height, width = image.shape[:2]

    if args.mode == "inpaint":
        mask = np.zeros((height, width), dtype=np.uint8)
        for region in regions:
            x, y, w, h = region_to_pixels(region, width, height)
            cv2.rectangle(mask, (x, y), (x + w, y + h), 255, thickness=-1)
        result = cv2.inpaint(image, mask, 3, cv2.INPAINT_TELEA)
    else:
        result = image.copy()
        for region in regions:
            x, y, w, h = region_to_pixels(region, width, height)
            roi = result[y:y + h, x:x + w]
            kernel_width = max(3, (w // 8) * 2 + 1)
            kernel_height = max(3, (h // 8) * 2 + 1)
            result[y:y + h, x:x + w] = cv2.GaussianBlur(roi, (kernel_width, kernel_height), 0)

    if not cv2.imwrite(args.output, result):
        raise ValueError("Could not write processed image")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)

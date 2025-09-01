# Converting Keras Model to TensorFlow.js

To properly integrate your Aloe Vera disease detection model, you need to convert your Keras model to TensorFlow.js format.

## Step 1: Install TensorFlow.js Converter

```bash
pip install tensorflowjs
```

## Step 2: Convert Your Model

```bash
# Convert Keras model to TensorFlow.js format
tensorflowjs_converter \
    --input_format=keras \
    --output_format=tfjs_layers_model \
    --quantize_float16 \
    ./aloe_model.keras \
    ./aloe_model/
```

## Step 3: Upload Converted Model

After conversion, you'll have:
- `model.json` - Model architecture
- `group1-shard1of1.bin` - Model weights

Upload these files to `/client/public/aloe_model/` directory.

## Step 4: Update Model Configuration

Make sure your model input size matches the preprocessing in `modelService.ts`:
- Current setting: 224x224 pixels
- Adjust if your model uses different dimensions

## Step 5: Verify Disease Classes

Update the `diseaseClasses` array in `modelService.ts` to match your model's output classes in the exact same order as your training data.

## Alternative: Use the Current Fallback

The app currently uses a filename-based fallback system that works without the converted model. This is useful for testing and demonstration purposes.

## Model Performance Tips

1. **Quantization**: Use `--quantize_float16` to reduce model size
2. **Optimization**: Consider using `--skip_op_check` if you encounter compatibility issues
3. **Testing**: Test the converted model with sample images before deployment

## Troubleshooting

- If conversion fails, ensure your Keras model is saved in the latest format
- Check that all custom layers are supported by TensorFlow.js
- Verify input/output shapes match your preprocessing pipeline
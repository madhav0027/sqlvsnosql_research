from flask import Flask, request, jsonify
import joblib
import pandas as pd

app = Flask(__name__)

model = joblib.load('./database_selector_model.pkl')
label_encoder = joblib.load('./label_encoder.pkl')
model_columns = joblib.load('./model_columns.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        
        input_df = pd.DataFrame([data])
        
        input_df = pd.get_dummies(input_df)
        input_df = input_df.reindex(columns=model_columns, fill_value=0)

        pred_encoded = model.predict(input_df)
        pred_label = label_encoder.inverse_transform(pred_encoded)
        
        return jsonify({
            "status": "success",
            "winner": str(pred_label[0])
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400

if __name__ == '__main__':
    app.run(debug=True, port=5500)

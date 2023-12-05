import pandas as pd
import numpy as np
import json
from datetime import datetime

from keras.models import load_model


model = load_model("model/test.h5")

def is_fraud(df):
    pred = model.predict(df)
    return pred[0][0]<0.5


import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def send_email(title, content):
    with open("_private/email.json", 'r') as file:
        email = json.load(file)
    msg = MIMEMultipart()
    msg['From'] = email['sender']
    msg['To'] = email['reciever']
    msg['Subject'] = title
    msg.attach(MIMEText(content, 'plain'))
    try:
        server = smtplib.SMTP('smtp.naver.com', 587)
        server.starttls()
        server.login(email['id'], email['pw'])
        server.sendmail(email['sender'], email['reciever'], msg.as_string())
        print("이메일 전송 성공")
    except Exception as e:
        print("이메일 전송 실패:",str(e))
    finally:
        server.quit()



from flask import Flask, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/receive_data', methods=['POST'])
def receive_data():
    try:
        data = request.json  
        df = pd.DataFrame(data['info'], index=[0])
        price = df['Amount'].loc[0]
        Class = df['Class'].loc[0]
        if data['type'] == "pay":
            if is_fraud(df.drop('Class', axis=1)):
                print(Class,price,"이상결제가 감지되었습니다.",datetime.now())
                send_email('이상 결제', f'이상 결제가 감지되었습니다 \n{price}달러 \n{datetime.now()}')
                return {"status": "fail","price":str(price)}
            else :
                print(Class,price,"결제가 완료되었습니다.",datetime.now())
                return {"status": "success","price":str(price)}
        return {"status": "error", "message": "Data received successfully"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
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

import base64
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.serialization import load_pem_public_key


# 전자 서명 검증
def verify_signature(message, signature):
    with open('_private/public_key.pem', 'rb') as key_file:
        public_key = load_pem_public_key(key_file.read(), backend=default_backend())
    try:
        public_key.verify(
            base64.b64decode(signature),
            message.encode('utf-8'),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        print("서명 검증 성공")
        return True
    except Exception as e:
        print("서명 검증 실패:", e)
        return False



from flask import Flask, request
from flask_cors import CORS
app = Flask(__name__)
CORS(app)

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        if(data['id'] == 1234 and data['pw'] == 1234):
            with open('_private/public_key.pem', 'w') as f:
                f.write(data['publicKey'])
            print("로그인 완료")
            return {"status": "success"}
        else:
            return {"status": "fail"}
    except Exception as e:
        print(e)
        return {"status": "error", "message": str(e)}
    


@app.route('/pay', methods=['POST'])
def pay():
    try:
        data = request.json
        payment_str = json.dumps(data['payment']).replace(" ", "")
        print(payment_str)
        print(data['signature'])
        if verify_signature(payment_str,data['signature']):
            print("성공")
        else:
            print("실패")
            return {"status": "fail-cert","message":"invalid cert"}

        df = pd.DataFrame(data['payment'], index=[0])
        price = df['Amount'].loc[0]
        y = df['Class'].loc[0]
        if is_fraud(df.drop('Class', axis=1)):
            print(y,price,"이상결제가 감지되었습니다.",datetime.now())
            # send_email('이상 결제', f'이상 결제가 감지되었습니다 \n{price}달러 \n{datetime.now()}')
            return {"status": "fail-pay","price":str(price)}
        else :
            print(y,price,"결제가 완료되었습니다.",datetime.now())
            return {"status": "success-pay","price":str(price)}
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == '__main__':
    app.run(host='0.0.0.0',debug=True,port=5000,ssl_context=('/etc/letsencrypt/live/tawkor.xyz/fullchain.pem', '/etc/letsencrypt/live/tawkor.xyz/privkey.pem'))


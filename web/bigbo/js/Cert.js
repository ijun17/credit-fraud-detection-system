class Cert {
    keyPair
    privateKey;
    publicKey;
    publicKeyBase64
    privateKeyBase64
    publicKeyPem
    privateKeyPem
    constructor(){}

    async generateKey(){
        try {
            const subtleCrypto = window.crypto.subtle;
        
            // 키 쌍 생성 알고리즘 설정 (이 예제는 RSA를 사용)
            const keyPair = await subtleCrypto.generateKey(
                {
                    name: 'RSA-PSS',
                    modulusLength: 2048,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: { name: 'SHA-256' },
                },
                true,
                ['sign', 'verify']
            );
            this.keyPair = keyPair
            this.publicKey = await subtleCrypto.exportKey('spki', keyPair.publicKey);
            this.privateKey = await subtleCrypto.exportKey('pkcs8', keyPair.privateKey);
            this.publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(this.publicKey)));
            this.privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(this.privateKey)));
            this.publicKeyPem = this.exportKeyToPem(this.publicKeyBase64, "PUBLIC")
            this.privateKeyPem = this.exportKeyToPem(this.privateKeyBase64, "PRIVATE")
        
            console.log(this.publicKeyPem);
            console.log(this.privateKeyPem);
        } catch (error) {
            console.error('키 생성 실패:', error);
        }
    }

    async createSignature(message) {
        try {
            const subtleCrypto = window.crypto.subtle;
        
            // 메시지 해싱
            const encoder = new TextEncoder();
            const data = encoder.encode(message);
            const hashBuffer = await subtleCrypto.digest('SHA-256', data);

            // 전자서명 생성
            const signature = await subtleCrypto.sign(
                {
                    name: 'RSA-PSS',
                    saltLength: 32,
                },
                this.keyPair.privateKey,
                hashBuffer
            );
            console.log("전자서명",signature)
            // Base64 인코딩
            const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
        
            console.log('메시지:',message,'\n\n','전자서명:', signatureBase64);
            return signatureBase64
        } catch (error) {
            console.error('전자서명 생성 실패:', error);
            return null
        }
    }


    exportKeyToPem(keybase64, type) {
        if(type != 'PUBLIC' && type != 'PRIVATE')console.error("invalid key type")

        const chunks = [];
        for (let i = 0; i < keybase64.length; i += 64) {
            chunks.push(keybase64.slice(i, i + 64));
        }
    
        const pemString = `-----BEGIN ${type} KEY-----\n${chunks.join('\n')}\n-----END ${type} KEY-----`;
        return pemString;
    }
}
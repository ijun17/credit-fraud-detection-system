const html_card = document.getElementById('card');
const html_overlay= document.querySelector('.overlay');
const html_id_input = document.querySelector('.id');
const html_pw_input = document.querySelector('.pw');
const html_login_button = document.querySelector('.login');
const html_login_form = document.querySelector('.login-form');

function rotateCard(event) {html_card.classList.toggle("card-rotated")}
function showLoading() {html_overlay.style.display = 'flex';}
function hideLoading() {html_overlay.style.display = 'none';}


function post(loc, data, f1=()=>{}, f2=()=>{}){
    console.log(`post("${loc}",${JSON.stringify(data)})`)
    fetch(`https://${window.location.host}:5000/${loc}`, {
        method: 'POST',
        mode: "cors",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(data => {
        console.log(data)
        f1(data)
    })
    .catch(error => {
        console.error(error);
        f2(error);
    });
}



function postLogin(id=1234,pw=1234,publicKey=""){
    post("login",{id:id,pw:pw,publicKey:publicKey},(data)=>{
        if(data.status == "success"){
            alert("로그인이 완료되었습니다.")
            html_login_form.innerHTML="<div>김준기님 안녕하세요</div>"
        }
        else alert("로그인이 실패했습니다.")
    },(e)=>{alert("로그인 오류"+e)})
}


const cert = new Cert()
cert.generateKey().then(()=>{
    html_login_button.addEventListener("click",()=>{
        postLogin(html_id_input.value, html_pw_input.value, cert.publicKeyPem)
    })
})




async function postPay(event,isFraud=false){
    event.stopPropagation();
    showLoading()
    const datas = isFraud?FRAUD_DATA:NORMAL_DATA
    const data = datas[Math.floor(Math.random()*datas.length)]
    const data_str = JSON.stringify(data).split(' ').join('')
    const signature = await cert.createSignature(data_str);
    // alert('메시지:'+data_str+'\n\n'+'전자서명:'+signature)
    post("pay",{payment:data,signature:signature},(data)=>{
        hideLoading()
        switch(data.status){
            case 'success-pay':alert(`결제가 완료되었습니다.(${data.price}달러)`); break;
            case 'fail-pay':alert(`이상결제가 감지되었습니다.(${data.price}달러)`); break;
            case 'fail-cert':alert(`인증되지 않은 사용자입니다.`); break;
            default : alert("오류"+data.message); break;
        }
    },(error)=>{
        hideLoading()
        alert("오류"+error)
    })
}


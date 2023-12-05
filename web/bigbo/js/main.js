const html_card = document.getElementById('card');
const html_overlay= document.querySelector('.overlay');

function rotateCard(event) {
    html_card.classList.toggle("card-rotated")
}

function postData(data){
    showLoading()
    console.log(data)
    fetch(`http://${window.location.host}:5000/receive_data`, {
        method: 'POST',
        mode:'cors',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({"type":"pay", "info":data}),
    })
    .then(response => response.json())
    .then(data => {
        console.log(data)
        hideLoading()
        switch(data.status){
            case 'success':alert(`결제가 완료되었습니다.(${data.price}달러)`); break;
            case 'fail':alert(`이상결제가 감지되었습니다.(${data.price}달러)`); break;
            default : alert("오류"); break;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        hideLoading()
        alert("오류"+error)
    });
    
}

function postFraud(event){
    postData(FRAUD_DATA[Math.floor(Math.random()*FRAUD_DATA.length)])
    event.stopPropagation();
}

function postNormal(event){
    postData(NORMAL_DATA[Math.floor(Math.random()*NORMAL_DATA.length)])
    event.stopPropagation();
}

function showLoading() {
    html_overlay.style.display = 'flex';
}


function hideLoading() {
    html_overlay.style.display = 'none';
}
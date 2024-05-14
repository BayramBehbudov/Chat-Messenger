import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";

import {
    getDatabase,
    ref,
    push,
    get
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";



const firebaseConfig = {
    apiKey: "AIzaSyChI-6hrPNf6i2TwGVchRTMQnUbWU5uqVI",
    authDomain: "myfirstchat-e6426.firebaseapp.com",
    databaseURL: "https://myfirstchat-e6426-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "myfirstchat-e6426",
    storageBucket: "myfirstchat-e6426.appspot.com",
    messagingSenderId: "122082411011",
    appId: "1:122082411011:web:8ec3e93a4bcabef11ac436",
    measurementId: "G-FLLBNMV82K"
};


const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const usersRef = ref(database, "users");



const inputsRegistr = document.querySelectorAll("#register-form input") // registr formdakı inputlar
const inputsLogin = document.querySelectorAll("#login-form input") // login formdakı inputlar
const loginBtn = document.getElementById("login-btn")  // login btn
const registerBtn = document.getElementById("register-btn") // registr btn

document.addEventListener("DOMContentLoaded", function () {  // bütün səhifə yükləndikdən sonra 
    document.getElementById('register-link').addEventListener('click', () => {  // istifadəçi qeydiyyatdan keçmək linkinə klik etdikdə
        document.getElementById('login-form').style.display = 'none';  // login inputları bağlanır
        document.getElementById('register-form').style.display = 'block'; // registr inputları çıxır

    });

    document.getElementById('login-link').addEventListener('click', () => {
        // istifadəçi registr səhifəsində ikən login səhifəsinə keçid linkinə klik etdikdə yuxarıdakının əksi baş verir
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
    });


    loginBtn.onclick = async function () {  // giriş məlumatlarını daxil edib login btn klik etdikdə
        if (checkInputs(inputsLogin)) { // əgər inputlar doludursa

            if (
                await usersControl(document.getElementById("login-email").value, document.getElementById("login-password").value)
            ) { // və əgər istifadəçi məlumatları doğrudursa
                window.location.href = "home.html"; // yöndləndir index səhifəsinə
            } else { // əgər doğru deyilsə  

                writeErrorMessage("login-form", "User not found")
            }
        }

    };

    registerBtn.onclick = () => { // registr formdakı registr btna klik olanda

        if (checkInputs(inputsRegistr)) { // əgər registr inputlar doludursa

            const registerEmail = document.getElementById("register-email").value
            const registerName = document.getElementById("register-name").value
            const registerSurname = document.getElementById("register-surname").value
            const registerPassword = document.getElementById("register-password").value
            const registerBirthday = document.getElementById("register-birthday").value

            if (findUsers(registerEmail)) { // əgər bu email daha öncə qeydiyyatdan keçməyibsə
                if (isValidEmail(registerEmail)) { // mail forması doğrudursa

                    push(usersRef, {
                        registerEmail,
                        registerName,
                        registerSurname,
                        registerPassword,
                        registerBirthday
                    });
                    writeErrorMessage("register-form", "Registration completed")
                } else {
                    writeErrorMessage("register-email-container", "Enter a valid email address")
                }

            } else {
                writeErrorMessage("register-form", "This user already exists")
            }
        }
    }



    function checkInputs(inputs) { //inputların dolu olub olmadığını yoxlayan funksiya, arqument olaraq yoxlayacağı səhifənin inputlarını alır

        let result = true

        inputs.forEach(item => { // inputları döndürür
            if (!item.value) { //hansı input boşdursa 
                item.setAttribute("style", "border: 1px solid red;")  // həmin inputu qırmızı edir

                setTimeout(() => { // 2 saniyə sonra silir qırmızı borderi
                    item.removeAttribute("style", "border: 1px solid red;")
                }, 2000);

                result = false // və false qaytarır
            }
        })
        return result  // əks halda true qaytarır

        //P.S Bu məntiq düz deyil amma kodumuz işlədiyi üçün toxunmuram)))
    }
});


async function usersControl(email, password) { // login zamanı istifadəçi məlumatlarını yoxlayır dogrudursa true deyilsə false qaytarır

    let result = false

    const usersData = await getDataInDatabase("users")
    Object.keys(usersData).forEach(userKey => {

        const user = usersData[userKey]

        if (user.registerEmail === email && user.registerPassword === password) {
            localStorage.setItem("activeUserName", user.registerName);
            localStorage.setItem("activeUserMail", user.registerEmail);
            localStorage.setItem("activeUserKey", userKey)
            localStorage.setItem('entry', true)
            result = true
        }
    })

    return result

}


function writeErrorMessage(id, messages) {
    let div = document.createElement("div")  //yeni div yaradırıq
    div.setAttribute("style", "text-align: center; color: red;") //dizayn edirik 
    div.appendChild(document.createTextNode(`${messages}`)) //içərisinə istifadəçi mövcuddur yazırıq
    document.getElementById(`${id}`).appendChild(div) // register forma yerləşdiririk


    setTimeout(() => {  //2 saniyə sonra silirik
        document.getElementById(`${id}`).removeChild(div)
    }, 2000);
}

async function findUsers(email) {  // bu funksiya ona gələn emaili databasedə olan maillər ilə müqayisə edir əgər yoxdusa true varsa false return edəcək

    let result = true

    const usersData = await getDataInDatabase("users") // datanı əldə edirik

    Object.keys(usersData).forEach(userKey => { // əldə etdiyimiz datadan user keylərə görə döngü edirik
        if (usersData[userKey].registerEmail === email) { // və hər döngüdə emailləri yoxlayırıq əgər arqument olaraq gələn mailə bərabərdirsə false return edirik
            result = false
        }
    })
    return result
}



function isValidEmail(email) {  // daxil edilən email inputunun içindəki məlumatın emailin conteksinə uyğunluğunu yoxlayır
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}



document.getElementById("register-email").addEventListener("change", (e) => { // bu funksiya əgər email düzgün formada daxil edilməyibsə inputun altına düzgün yazmasını tələb edir
    const inputValue = e.target.value

    if (!isValidEmail(inputValue)) {
        writeErrorMessage("register-email-container", "Enter a valid email address")
    }
});


async function getDataInDatabase(url) {
    const userData = (await get(ref(database, `${url}`))).val()
    return userData
}
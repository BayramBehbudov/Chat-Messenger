const activeUserName = localStorage.getItem("activeUserName");  //lokalda olan adı götürürük
const activeUserMail = localStorage.getItem("activeUserMail");  //lokalda olan maili götürürük
const activeUserKey = localStorage.getItem("activeUserKey");  //lokalda olan keyi götürürük


// istifadəçinin həqiqətən login səhifəsindən gəlib gəlmədiyini yoxlayırıq
if (!localStorage.getItem('entry') || activeUserKey == null || activeUserMail == null || activeUserName == null) {
    window.location.href = "./index.html"
    localStorage.clear()
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";

import {
    getDatabase,
    ref,
    onValue,
    push,
    set,
    get,
    remove,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";

import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-storage.js";


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
const storage = getStorage(app);

// selectorlar
const searchIconSelector = document.querySelector(".icon-container")
const modal = document.querySelector(".modal")
const modalContent = document.querySelector(".modal-content")
const leftSectionForMessages = document.getElementById("leftSectionForMessages")
const deleteChatIconSelector = document.querySelector(".deleteIcon")
let activeBoardKey

// databaseyə müraciətlər
async function getDataInDatabase(url) {
    const userData = (await get(ref(database, `${url}`))).val()
    return userData
}

function setDataInDatabase(url, data) {
    set(ref(database, `${url}`), data)
}

function pushDataInDatabase(url, data) {
    push(ref(database, `${url}`), data)
}

onValue(ref(database, `users/${activeUserKey}/newMessages`), (snap) => {
    writeLastMessages()
    setDataInDatabase(`users/${activeUserKey}/newMessages`, "false")

    if (activeBoardKey) {
        openMsgBoard(activeBoardKey)
    }
})


//  inputun valuesini götürmək üçün funksiya. inputun id-ni arqument olaraq qəbul edir
function getInputValue(idName) {
    const input = document.getElementById(`${idName}`)
    let value
    input.value.trim() ? value = input.value : false
    input.value = ""

    return value
}


// bu funksiya halhazırki tairxi saat:dəqiqə formasında qaytarır
function getHoursAndMinutes() {
    let hour = new Date().getHours().toString().padStart("2", 0)
    let minute = new Date().getMinutes().toString().padStart("2", 0)
    return `${hour}:${minute}`
}


document.getElementById("welcomeMessage").textContent = `Welcome, ${activeUserName}!`;  // qarşılama mesajı


document.querySelector(".userPic").src = `${(await getDataInDatabase(`users/${activeUserKey}`)).profilPicUrl}`
searchIconSelector.addEventListener("click", searchParams) // istifadəçini axtar iconuna click eventi 

// close modala click olanda modalı bağlayır
document.querySelector(".closeModal")?.addEventListener("click", () => {
    modal.style.display = "none"
    modalContent.innerHTML = ""
});


async function searchParams() {  // istifadəçini axtarmaq üçün funksiya

    const searchInputValue = getInputValue("searchInput") // inputun valuesi
    const allUsersDataInFirebase = await getDataInDatabase("users")  // databasedən users məlumatlarını  götürürük

    const foundCurrentUserInfo = Object.entries(allUsersDataInFirebase).filter(users => users[1].registerEmail == searchInputValue)[0]  // yoxlayırıq əgər databasedə inputdan gələn valueyə uyğun məlumat varsa mənimsədirik dəyişənə


    if (foundCurrentUserInfo != undefined) { // əgər foundCurrentUserInfo məlumat varsa
        writeInfoInModal(foundCurrentUserInfo) //funksiyaya ötrürük ki yazdıraq istifadəçi məlummatlarını
    } else { // əgər məlumat yoxdusa
        modal.style.display = "block"
        modalContent.textContent = `No such user found` // mesajı ötürürük modala
        modalContent.setAttribute("style", "font-size: 16px; color: white;") // modala dizayn veririk
    }

}


async function writeInfoInModal(userInfo) { // bu funksiya modalın içinə göndərilən məlumatlara uyğun məlumat dərc edirik

    modal.style.display = "block" // modalı açırıq ki nəticəni yazdıraq
    modalContent.innerHTML =
        `<img src="${userInfo[1].profilPicUrl}" class="imgForModal" alt="profilePicture" style="width: 40%; border-radius: 40%;">
        <ul class="userInfoStyle  userKey="${userInfo[0]}"">
            <li>Name: ${userInfo[1].registerName}</li>
            <li>Surname: ${userInfo[1].registerSurname}</li>
            <li>Email:
            ${userInfo[1].registerEmail
        }</li>
            <li>Birthday: ${userInfo[1].registerBirthday
        }</li>
            <li><button class="msgBtnInModal">Write Message</button> 
            <button class="setFriendBtn">${(await getDataInDatabase(`users/${activeUserKey}/friends`))?.includes(userInfo[0]) ? "Delete Friend" : "Add Friend"}</button></li>
        </ul>`
    document.querySelector(".setFriendBtn").addEventListener("click", async () => {
        setFriend(userInfo[0], userInfo[1].registerName)
        modal.style.display = "none" // modalI bağladıq
        modalContent.innerHTML = ""
    })



    // modal açıq olan zaman msj yaz btna klik olanda contact yaratmaq ucun
    document.querySelector(".msgBtnInModal")?.addEventListener("click", async () => {
        modal.style.display = "none" // modalI bağladıq

        // funksiyanı çağırırıq ki yoxlayaq bu istifadəçilər arasında mesajlaşma arxivi var ya yox
        const msgKey = await controlMsg(userInfo[0])


        if (msgKey == undefined) { // əgər yoxdursa

            // yeni contact yaradırıq
            pushFirstMessage(userInfo)
        } else { // əgər arxiv varsa həmin arxivi açırıq
            openMsgBoard(msgKey)
        }

    })

}

// aşağıdakı funksiya add friend butonuna klik olduqda çağrılır və istifadəçi məlumatlarını alır. həmin istifadəçi  ilə activeUser dostdursa silir deyilse dost siyahısına əlavə edir
async function setFriend(userKey, userName) {
    let myFriends = (await getDataInDatabase(`users/${activeUserKey}`)).friends
    let data = `<div class="friendItem" id="${userKey}">${userName}</div>`

    if (!myFriends) {
        myFriends = data
    } else if (myFriends && !myFriends.includes(data)) {
        myFriends += data
    } else if (myFriends && myFriends.includes(data)) {
        myFriends = myFriends.replace(data, "")
    }
    setDataInDatabase(`users/${activeUserKey}/friends`, myFriends)
}




// aşağıdakı funksiya axtarış zamanı çıxan modalda mesaj yaz buttona klik olanda istifadəçi ilə tapılan istifadəçi arasında contact yaradır
async function pushFirstMessage(secondUserInfo) {
    const msgText = "" // ilk msj olduğu üçün boş string
    const lastMsgTime = getHoursAndMinutes() // halhazırkı tarix

    // yaradılacaq contactın formatı
    const msgDataForPush = {
        usersKey: [activeUserKey, secondUserInfo[0]],
        userName: [activeUserName, secondUserInfo[1].registerName],
        msgText,
        lastMsgTime,
    }

    // push etdik
    pushDataInDatabase(`messages`, msgDataForPush)

    // indi push etdiyimiz söbətin keyini götürürük
    const msgKey = await controlMsg(secondUserInfo[0])

    // mesaj konsolunda hazırkı mesajları yazdırırıq. əslində mesaj boş string olduğu üçün heçnə yazılmayacaq amma yuxarıda adı yazılacaq
    writeLastMessages()
    openMsgBoard(msgKey)
}


// bu funksiya istifadəçi ilə ona göndərilən istifadəçi arasında söhbət arxivi varsa həmin söbətin id-ni qaytarır
async function controlMsg(userKey) {
    const allMsg = await getDataInDatabase("messages")
    return Object.keys(allMsg ? allMsg : "").filter(key => {
        if (allMsg[key].usersKey.includes(userKey) && allMsg[key].usersKey.includes(activeUserKey)) {
            return key
        }
    })[0]
}




async function writeLastMessages() {  // bu funksiya istifadəçinin son yazışmalarının kimlər ilə olduğunu ekrana yazdırır

    const allMessages = await getDataInDatabase("messages"); // databasedən ümumi mesajları götürür

    // istifadəçinin id-nə uyğun olaraq filter edir və kimlər ilə yazışması varsa həmin mesajlaşmanın id-ni qaytarır
    const allMsgId = Object.keys(allMessages ? allMessages : "").filter(key => allMessages[key].usersKey.includes(activeUserKey))


    if (allMsgId.length != 0) { // öncədən mesajlaşma olubsa 

        let allMessagesText = ""

        // mesajlaşmanın kimlər ilə olduğunu tapıb sol sütuna göndəririk
        for (let i = 0; i < allMsgId.length; i++) {

            let msgKey = allMsgId[i]

            const secondUserName = allMessages[msgKey].userName.filter(username => username != activeUserName)[0]

            const secondUserKey = allMessages[msgKey].usersKey.filter(key => key != activeUserKey)[0]

            const secondUserPicUrl = await getDataInDatabase(`users/${secondUserKey}/profilPicUrl`)

            allMessagesText += `<li class="msgSelector" id="${msgKey}"><img src = ${secondUserPicUrl}><p>${secondUserName}</p><span>${allMessages[msgKey].lastMsgTime}</span></li > `
        }

        leftSectionForMessages.innerHTML = allMessagesText

    }

}

//sol sütundakı adlara klik olanda
leftSectionForMessages.addEventListener("click", function (event) {
    if (event.target.classList.contains("msgSelector")) {
        // həmin adlar həm də söhbətin id-ni öz id-si olaraq saxlayır.həmin id-ni götürürük
        const msgKey = event.target.id;
        // mesaj konsolunu açırıq
        openMsgBoard(msgKey)

    }
});

// mesaj konsolunu açan funksiya. arqument olarraq açacağı söbətin id-ni və söhbətdəki ikinci tərəfin adını alır və müvafiq olaraq yazdırır

async function openMsgBoard(msgKey) {

    const msgData = await getDataInDatabase(`messages/${msgKey}`)
    const secondUserKey = msgData.usersKey.filter(key => key != activeUserKey)[0]
    const userdata = await getDataInDatabase(`users/${secondUserKey}`)
    const secondUserPicUrl = userdata.profilPicUrl
    document.querySelector("#imgForMessages").src = secondUserPicUrl
    // qarşı tərəfin adını yazdırırıq
    document.querySelector("#nameForMessages").textContent = msgData.userName.filter(username => username != activeUserName)[0]


    document.querySelector("#nameForMessages").addEventListener("click", async () => {
        writeInfoInModal([secondUserKey, userdata])
    })

    // mesaj konsoluna ona göndərilən id-nin içərisindəki mesajları yazırıq
    document.querySelector("#messagesBoard").innerHTML = msgData.msgText
    leftOrRight()
    // həmin konsoldakı inputa key adında atribut mənimsədirik. atributun dəyəri açıq olan söbətin id-si olacaq. bu bizə yeni mesaj göndərərkən hansı söbətə göndərəcəyimizi bilmək üçün lazımdır.
    document.querySelector("#messagesBoard").setAttribute("key", msgKey)
    deleteChatIconSelector.setAttribute("key", msgKey)

    // mesaj göndər buttonu başlanğıcda disabled idi onu aktiv edirik
    document.querySelector("#btnForSendMsg").disabled = false

    document.querySelector(".deleteIcon").style.display = "block"

    activeBoardKey = msgKey

}


// aşağıdakı funkiya istifadəçinin öz mesajlarını sağ tərəfə çəkir qarşı tərəfin mesajları isə solda qalır

function leftOrRight() {
    const msgs = document.querySelectorAll(".message")
    msgs.forEach(msg => {
        const msgName = msg.querySelector("h6").textContent
        msgName == activeUserName ? msg.setAttribute("style", "align-self: flex-end;") : ""
    })
}



document.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        if (activeBoardKey) {
            msgSender()
        } else {
            alert("Choose who you want to talk to!")
        }
    }
});





// mesaj konsolundakı send buttonuna klik eventi
document.querySelector("#btnForSendMsg").addEventListener("click", msgSender)

async function msgSender() {
    // mesajı göndərəcəyimiz söhbətin id-ni əldə edirik
    const currentMsgKey = document.getElementById("messagesBoard").getAttribute("key")
    // öncəki mesajları və tərəflərin id-lərini əldə edirik
    let msgText = await getDataInDatabase(`messages/${currentMsgKey}/msgText`)
    const users = await getDataInDatabase(`messages/${currentMsgKey}/usersKey`)
    // burada qarşı tərəfi müəyyən edirik
    const secondUserKey = users.filter(userKey => userKey != activeUserKey)

    msgText = msgText.replace('id="endMsg"', "")

    // inputun valuesi
    const inputValue = await getInputValue("inputForMessage")

    // aşağıda isə yoxlayırıq ki inputun valuesu və mesajı göndərəcəyimiz söhbətin id-si varmı
    if (inputValue && currentMsgKey != null) {
        msgText += `<div class="message" id="endMsg"><div>    <h6>${activeUserName}</h6>    <span>${getHoursAndMinutes()}</span></div><div>    <p> ${inputValue}</p></div></div>`
        setDataInDatabase(`messages/${currentMsgKey}/msgText`, msgText)
        setDataInDatabase(`messages/${currentMsgKey}/lastMsgTime`, getHoursAndMinutes())
        setDataInDatabase(`users/${secondUserKey}/newMessages`, "true")
    }

    // console.log(document.querySelector("#endMsg").scrollHeight);
    openMsgBoard(currentMsgKey)

}




//logout klik olduqda
document.querySelector(".logOut").addEventListener("click", () => {
    localStorage.clear()
    window.location.href = "./index.html"
})





// istifadəçi məlumatlarını dəyişmək istəyərsə

document.querySelector(".setProfile").addEventListener("click", () => {
    modal.style.display = "block"
    modalContent.innerHTML = `<div class="setContainer">
    <div>Change Account Info</div>
    <div class="setInputs">
        <input type="email" id="set-email"
            name="set-email" placeholder="Email">
    </div>

    <div class="setInputs">
        <input type="text" id="set-name" name="set-name"
            placeholder="Name">
    </div>

    <div class="setInputs">
        <input type="text" id="set-surname"
            name="set-surname" placeholder="Surname">
    </div>

    <div class="setInputs">
        <input type="password" id="set-password"
            name="set-password" placeholder="Password">
    </div>

    <div class="setInputs">
        <input type="date" id="set-birthday"
            name="set-birthday" placeholder="Birthday">
    </div>

    <div class="setInputs">

    <div class="profilePicCont">

         <label for="set-profilePicture" class="profilPiclabel">
            <i class="fa-solid fa-cloud-arrow-up"><p class="profilPicText">Choose your picture</p></i>
        </label>

        <input type="file" id="set-profilePicture">
    </div>
    </div>
    
    <button class="setBtn">Save</button>
    </div>
    `



    document.querySelector(".setBtn").addEventListener("click", () => {

        let emailSel = document.querySelector('#set-email');
        let nameSel = document.querySelector('#set-name');
        let surnameSel = document.querySelector('#set-surname');
        let passwordSel = document.querySelector('#set-password');
        let birthdaySel = document.querySelector('#set-birthday');
        let profilePicSel = document.getElementById('set-profilePicture')


        if (emailSel.value) {
            if (isValidEmail(emailSel.value)) {
                setDataInDatabase(`users/${activeUserKey}/registerEmail`, emailSel.value)
                emailSel.value = ""
            } else {
                emailSel.setAttribute("style", "border: 1px solid red;")

                setTimeout(() => {
                    emailSel.removeAttribute("style", "border: 1px solid red;")
                }, 2000);
            }
        }

        if (nameSel.value) {
            setDataInDatabase(`users/${activeUserKey}/registerName`, nameSel.value)
            nameSel.value = ""
        }
        if (surnameSel.value) {
            setDataInDatabase(`users/${activeUserKey}/registerSurname`, surnameSel.value)
            surnameSel.value = ""
        }
        if (passwordSel.value) {
            setDataInDatabase(`users/${activeUserKey}/registerPassword`, passwordSel.value)
            passwordSel.value = ""
        }

        if (birthdaySel.value) {
            setDataInDatabase(`users/${activeUserKey}/registerBirthday`, birthdaySel.value)
            birthdaySel.value = ""
        }

        if (profilePicSel.files[0]) {
            setProfilPic(profilePicSel.files[0])
        }

        modal.style.display = "none"

    })
})



function isValidEmail(email) {  // daxil edilən email inputunun içindəki məlumatın emailin conteksinə uyğunluğunu yoxlayır
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}




deleteChatIconSelector.addEventListener("click", () => {
    let msgBoardKey = deleteChatIconSelector.getAttribute("key")
    remove(ref(database, `messages/${msgBoardKey}`))
    writeLastMessages()
    document.querySelector("#nameForMessages").textContent = ""
    messagesBoard.innerHTML = `
    <p
    style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 20px; color: rgb(246, 6, 6); font-weight: bold;">Welcome
    my FirstChatProject.com
</p>`

})



// aşağıdakı funksiya istifadəçinin dostlarını modalda göstərir
document.querySelector(".friends").addEventListener("click", async () => {
    modal.style.display = "block"
    let allFriends = await getDataInDatabase(`users/${activeUserKey}/friends`)
    if (allFriends) {
        modalContent.innerHTML = `
    <div class="friendList" >
    ${allFriends}</div >
    `
    } else {
        modalContent.textContent = "Not your friend"
    }
})


// dostlar siyahısındakı adlara klik olanda həmin istifadəçinin məluimatları ekrana çıxır
modalContent.addEventListener("click", async (event) => {
    if (event.target.classList.contains("friendItem")) {
        const userkey = event.target.id;
        writeInfoInModal([userkey, await getDataInDatabase(`users/${userkey}`)])
    }
});



function setProfilPic(file) {
    const storageReference = storageRef(storage, 'profilePictures/' + activeUserKey);
    const uploadTask = uploadBytesResumable(storageReference, file);

    uploadTask.on('state_changed',
        (snapshot) => {
            document.querySelector('.profilPicText').textContent = "loading..."
        },
        (error) => {
            console.error('Upload error:', error);
        },
        () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                setDataInDatabase(`users/${activeUserKey}/profilPicUrl`, downloadURL)
                document.querySelector('.profilPicText').textContent = file.name;
            });
        }
    );

}


Babble = {};

Babble.getXhrReq = (url) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = () => resolve(xhr.responseText);
    xhr.onerror = () => reject(xhr.statusText);
    xhr.send();
  });
}

Babble.postXhrReq = (url, data) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);
      xhr.setRequestHeader("Content-type", "application/json");
      xhr.onload = () => resolve(xhr.responseText);
      xhr.onerror = () => reject(xhr.statusText);
      xhr.send(data);
    });
}

Babble.deleteXhrReq = (url, data) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("DELETE", url);
      xhr.onload = () => resolve(xhr.responseText);
      xhr.onerror = () => reject(xhr.statusText);
      xhr.send(data);
    });
  };

Babble.saveLocalStorage = (ls) => {
    window.localStorage.setItem("babble",JSON.stringify(ls));
}

Babble.register = (userInfo) => {
    var ls = Babble.getLocalStorage();
    if (ls == null) {
        ls = {"currentMessage":0,"userInfo":null};
    }
    ls.userInfo = userInfo;
    Babble.saveLocalStorage(ls);
    document.getElementById("backdrop").style.display = "none";
}

Babble.getMessages = (counter, func) => {
    Babble.getXhrReq(`/messages?counter=${counter}`).then( (res) => {
        func(res);
    });
}

Babble.getStats = (func) => {
    Babble.getXhrReq("/stats").then( (res) => {
        func(res);
    });
}

Babble.handleStats = (stats) => {
    stats = JSON.parse(stats);
    document.getElementById("msg-stat").innerHTML = stats.totalMessageCount;
    document.getElementById("users-stat").innerHTML = stats.totalNumberOfConnectedUsers
}

Babble.stringToHtml = (string) => {
    var html = string;      
    var fragmentFromString = function (strHTML) {
        return document.createRange().createContextualFragment(strHTML);
    }
    var fragment = fragmentFromString(html);
    return fragment;
}

Babble.updateScroll = (el) => {
  el = document.getElementById(el);
  el.scrollTop = el.scrollHeight;
}

Babble.deleteMessage = (id, func) => {
    console.log("del");
    Babble.deleteXhrReq(`/messages/${id}`).then( (res) => {
        
    });
}

Babble.getLocalStorage = () => {
    var ls = window.localStorage.getItem("babble");
    if (ls != null) {
        ls = JSON.parse(ls);
    }
    return ls;
}

Babble.postMessage = (msg, func) => {
    var userInfo = Babble.getLocalStorage().userInfo;
    var date = new Date();
    var now = date.getTime();
    if (userInfo != null) {
        msgObject = {
            name: userInfo.name,
            email: userInfo.email,
            msg: msg,
            timestamp: now
        }
    }
    else {
        msgObject = {
            name: null,
            email: null,
            msg: msg,
            timestamp: now
        }        
    }
    Babble.postXhrReq("/messages",JSON.stringify(msgObject))
    .then( (res) => {
        func(res);
    });
}

Babble.handlePostMessage = (res) => {
    var ls = Babble.getLocalStorage();
    document.getElementById("text-msg").value = "";    
}

Babble.handleSubmit = (e) => {
    e.preventDefault();
    var msg = document.getElementById("text-msg").value;
    var event = window.event ? window.event : e;
    if (event.type == "keyup") {
        // If from enter
        if (event.keyCode==13) {
            Babble.postMessage(msg,Babble.handlePostMessage);
        }
    }
    else {
        // If from submit
        Babble.postMessage(msg,Babble.handlePostMessage);
    }
}

Babble.handleRegister = (type) => {
    if (type=="user") {
        var name = document.getElementById("fullname").value;
        var email = document.getElementById("email").value;
        var userInfo = {"name":name,"email":email};
        Babble.register(userInfo);
    }
    else {
        Babble.register(null);
    }
}

Babble.handleMessageDelete = (msgId) => {
    document.getElementById(`msg${msgId}`).remove();
}

Babble.handleNewMessages = (res) => {
    var ls = Babble.getLocalStorage();
    if (ls == res[res.length-1].id) return;
    function addMessage(msg) {
        var newMsg = Babble.stringToHtml(
            `
            <li id="msg${msg.id}" tabindex="${msg.id}">
                <img src="https://www.gravatar.com/avatar/${msg.md5email}" alt="" />
                <p email="${msg.email}" onmouseover="Babble.canDelete(event)">
                    <button class="delete-msg" onclick="Babble.deleteMessage(${msg.id},Babble.handleMessageDelete(${msg.id}))">X</button>
                    <cite>${msg.name}</cite><time>${msg.timestamp}</time>
                    <br/>
                    ${msg.msg}
                </p>
                <div class="u-clearfix"></div>
            </li>
            `
        );
        document.getElementById("chat").appendChild(newMsg);
    }

    res = JSON.parse(res);
    for (var item in res) {
        addMessage(res[item]);
        Babble.updateScroll("chat");
    }
    ls.currentMessage = res[res.length-1].id+1;
    Babble.saveLocalStorage(ls);
    Babble.getMessages(ls.currentMessage,Babble.handleNewMessages);
    setTimeout(function(){Babble.getStats(Babble.handleStats);},1500);
}

Babble.isRegister = () => {
    var ls = Babble.getLocalStorage();
    if (ls == null) {
        document.getElementById("backdrop").style.display = "block";
    }
}

Babble.init = () => {
    var ls = Babble.getLocalStorage();
    Babble.getMessages(0,Babble.handleNewMessages);
    Babble.isRegister();
}

Babble.canDelete = (e) => {
    var ls = Babble.getLocalStorage();
    var hoverEmail = e.toElement.getAttribute("email");
    if (hoverEmail == ls.userInfo.email) {
        e.toElement.classList.add("u-can-see-delete");
    }
}
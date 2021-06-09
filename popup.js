var channelList = [];
var toggleHiddenElement = document.getElementById("toggleHidden");
var inputElement = document.getElementById("input");
var channelListParent = document.getElementById("channel-list");

//sendMessage({refresh: true});

chrome.storage.sync.get(["channelList", "hideVideos"], (data) => {
    channelList = data.channelList ?? [];
    toggleHiddenElement.checked = data.hideVideos;
    initalizeList();
});

toggleHiddenElement.onclick = (e) => {
    chrome.storage.sync.set({hideVideos: toggleHiddenElement.checked});
    sendMessage({toggleHidden: toggleHiddenElement.checked});
};

inputElement.addEventListener("keyup", function (event) {
    if(event.key == 'Enter')
    {
        addItem(inputElement.value);

        inputElement.value = "";
    }
});

function addItem(value){
    var item = { name: value, enabled: true };
    channelList.push(item);
    saveChannelList();
    sendMessage({refresh: true});

    addItemToList(item);
}

function addItemToList(value)
{        
    var item = document.createElement("div");
    //item.style = "display: inline-block";
    
    var removeButton = document.createElement("button");
    removeButton.innerHTML = "x";
    removeButton.style.margin = "0px 3px 0px 0px";
    //removeButton.style.backgroundColor = "rgb(56, 53, 53)";
    //removeButton.style.color = "white";
    removeButton.onclick = (e) => {
        channelList.splice(channelList.indexOf(value), 1);
        saveChannelList();
        channelListParent.removeChild(e.currentTarget.parentNode);
        sendMessage({refresh: true});
    };

    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = value.enabled;
    checkbox.onclick = (e) => {
        var index = channelList.findIndex((element) => element.name == e.currentTarget.parentNode.textContent.substring(1));
        if(index >= 0) {
            channelList[index].enabled = e.currentTarget.checked;
            saveChannelList();
            sendMessage({refresh: true});
        }
    };

    item.appendChild(removeButton);
    item.appendChild(checkbox);
    item.insertAdjacentText("beforeend", value.name);

    channelListParent.appendChild(item);
}

function sendMessage(message){
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, message);
    });
}

function initalizeList()
{
    for(var i = 0; i < channelList.length; i++){
        addItemToList(channelList[i]);
    };
}

function saveChannelList()
{
    chrome.storage.sync.set({ "channelList": channelList }, () => { });   
}
var channelsToRemove;
var checkNewSectionInterval = 2000;
var hideVideos = true;
var numSections = 0;
var contentSelector = "#contents";

start();

function start() {
    chrome.storage.sync.get(["channelList", "hideVideos"], (data) => {
        if(data.hideVideos == null) chrome.storage.sync.set({ "channelList": [], "hideVideos": true }, () => { });
        channelsToRemove = data.channelList ?? [];
        hideVideos = data.hideVideos ?? true;

        var checkContentInterval = setInterval(() => {
            if(document.querySelector(contentSelector) != null)
            {
                clearInterval(checkContentInterval);
            
                checkNewSection(hideVideos);
                
                setInterval(() => {
                    checkNewSection(hideVideos);
                    var sections = document.getElementById("contents");
    
                    // Other extensions may hide videos independent from this one, so periodically check the section headers for videos
                    for(var c = 0; c < sections.children.length; c++) checkSection(c);
                }, checkNewSectionInterval);
            }
        }, 500);
        
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if(request.refresh) refresh();
    if(request.toggleHidden == true) { hideVideos = true; toggleHidden(true); }
    else if(request.toggleHidden == false) { hideVideos = false; toggleHidden(false); }
});

function refresh()
{
    chrome.storage.sync.get("channelList", (data) => {
        channelsToRemove = data.channelList ?? [];

        if(hideVideos) toggleHidden(true);
    });
}

function addHideButtons(sectionStart){
    var sections = document.getElementById("contents");

    for(var c = sectionStart; c < sections.children.length; c++) {
        var items = sections.children[c].querySelector("#items");
        
        if(items == null) continue;    

        for(var i = 0; i < items.children.length; i++){
            var hideButton = document.createElement("button");
            hideButton.textContent = 'x';
            hideButton.className = "hide-button";        
            hideButton.onclick = (e) => {
                var channelName = e.currentTarget.parentNode.textContent;
                channelName = channelName.substring(1);
                var channelIndex = channelsToRemove.findIndex((i) => i.name == channelName);
                if(channelIndex == -1) {
                    channelsToRemove.push({name: channelName, enabled: true});
                    chrome.storage.sync.set({channelList: channelsToRemove}, () => {});
                    refresh();
                }
                else if (!channelsToRemove[channelIndex].enabled) {
                    channelsToRemove[channelIndex].enabled = true;
                    chrome.storage.sync.set({channelList: channelsToRemove}, () => {});
                    refresh();
                }
            };
            var container = items.children[i].querySelector("yt-formatted-string");
            container.prepend(hideButton);
        }
    }
}

function toggleHidden(hidden, startSection = 0){
    var sections = document.getElementById("contents");

    numSections = startSection;
    for(var c = startSection; c < sections.children.length; c++){
        var items = sections.children[c].querySelector("#items");

        if(items == null) continue;

        numSections++;

        for (var i = 0; i < items.children.length; i++) {
            var node = items.children[i].getElementsByClassName("yt-simple-endpoint style-scope yt-formatted-string")[0];
            var channelName = node.textContent;

            var channelFound = false;
            for (var s = 0; s < channelsToRemove.length; s++) {
                if (channelsToRemove[s].enabled == true && channelsToRemove[s].name == channelName) {
                    channelFound = true;
                    if(hidden) {
                        items.children[i].classList.add("yt-sub-hider");
                        items.children[i].style.display = "none";
                        break;
                    }
                    else {
                        items.children[i].classList.remove("yt-sub-hider");
                        if (!items.children[i].classList.contains("osasoft-better-subscriptions_hidden")) items.children[i].style.display = "";
                        break;
                    }
                }
            }

            if(!channelFound) {
                items.children[i].classList.remove("yt-sub-hider");
                if (!items.children[i].classList.contains("osasoft-better-subscriptions_hidden")) items.children[i].style.display = "";
            }
        }

        //  Remove section header if no videos shown
        checkSection(c);
    }
}

function checkSection(sectionIndex) {
    var section = document.getElementById("contents").children[sectionIndex];
    var items = section.querySelector("#items");

    if(items == null) return;

    var videoFound = false;
    for (var i = 0; i < items.children.length; i++) {
        if (items.children[i].style.display != "none") {
            videoFound = true;
            break;   
        }
    }
    if (!videoFound) {
        section.classList.add("yt-sub-hider");
        section.style.display = "none";
    }
    else {
        section.classList.remove("yt-sub-hider");
        section.style.display = "";
    }
}

function checkNewSection(hideVideos){
    if (document.getElementById("contents").children.length - 1 > numSections){
        addHideButtons(numSections);
        if (hideVideos) toggleHidden(true, numSections);
    }
}
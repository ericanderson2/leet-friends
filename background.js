browser.runtime.onMessage.addListener(
  function(url, sender, onSuccess) {
    fetch(url).then(response => response.json()).then(data => onSuccess(data["data"]));
    return true;
    }
);

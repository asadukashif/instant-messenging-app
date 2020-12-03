
document.addEventListener('DOMContentLoaded', () => {

    const displayNameField = document.querySelector('#displayNameField')
    const saveBtn = document.getElementById('nameSaveBtn')
    saveBtn.disabled = true

    displayNameField.onkeyup = function () {

        if ((displayNameField.value).trim().length > 0)
            saveBtn.disabled = false;
        else
            saveBtn.disabled = true
    }

    saveBtn.onclick = () => {

        const displayName = displayNameField.value.toString().trim()

        if (displayName.trim().length !== 0) {
            localStorage.setItem('userDisplayName', displayName);
            saveBtn.dataset.dismiss = "modal"
            window.location.href = location.protocol + "//" + window.location.host + `/main`
        }
    }

})
//Javascript entry file
import { initializeApp } from 'firebase/app';
import {
    createUserWithEmailAndPassword,
    getAuth, onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut, updateProfile
} from 'firebase/auth';
import { getDatabase, ref, onValue, update, set } from 'firebase/database';



//FOR Aphrodite
const firebaseConfig = {
    apiKey: "AIzaSyC5bSPGBfRs9fhOQF8FZhl9iXf3Fh6lrkU",
    authDomain: "aphrodite-ceng-2021.firebaseapp.com",
    databaseURL: "https://aphrodite-ceng-2021-default-rtdb.firebaseio.com",
    projectId: "aphrodite-ceng-2021",
    storageBucket: "aphrodite-ceng-2021.appspot.com",
    messagingSenderId: "862254589566",
    appId: "1:862254589566:web:93a6c436124e06d97fda2f"
};


initializeApp(firebaseConfig);

const db = getDatabase();
const auth = getAuth();

//Master arrays
var master_moduleLocations = [];
var master_modules = [];
var master_layoutNames = [];
var master_voiceCommands = [];
var master_vc_layouts = [];

//storing layout module information
var enabledModulesArr = [];
var enabledModulesLocationArr = [];



// GLOBAL VARIABLES
window.loginRegSwitchBtn = document.getElementById('lr-switch');
window.newLayoutContainer = document.getElementById('new-layout-container');
window.newLayoutBtn = document.getElementById('new-layout-btn');
window.loginWindow = document.getElementById('login-container');
window.signOutBtn = document.getElementById('sign-out-btn');
window.signOutCancel = document.getElementById('sign-out-cancel');
window.cancelLayout = document.getElementById('new-layout-cancel');
window.submitLayout = document.getElementById('new-layout-submit');
window.settingsBtn = document.getElementById('settings-btn');
window.parentOfLayoutModules = document.getElementById('new-layout-options-inner-container');
window.parentOfHomeLayouts = document.getElementById('layouts-inner-container');
//for user and def containers
window.parentVoiceCommandContainer = document.getElementById('vc-inner-container');
window.recordVCBtn = document.getElementById('vc-controls-submit');
window.recordVCDD = document.getElementById('vc-controls-dd');
window.mirrorIdDD = document.getElementById('mirror_id_dd');
window.statusUpdateSpan = document.getElementById('vc-status-update');
window.layoutSetDD = document.getElementById('layout-set-dd');
//for notif div
window.notifParent = document.getElementById('notif-container');
window.notifTitle = document.getElementById('notif-title');
window.notifDesc = document.getElementById('notif-desc');
window.currentLayoutSetSpan = document.getElementById('current-layout-span');


//Notifications
// sendNotif('test', 'this is a notif');
function sendNotif(title, desc) {
    let top = notifParent.getBoundingClientRect().top +
        notifParent.ownerDocument.defaultView.pageYOffset;
    notifParent.style.top = top + 'px';
    notifTitle.innerHTML = title;
    notifDesc.innerHTML = desc;
    notifParent.style.display = 'block';
    notifParent.classList.remove('anim-Out');
    notifParent.classList.add('anim-In');
    setTimeout(function () {
        notifParent.classList.remove('anim-In');
        notifParent.classList.add('anim-Out');
        setTimeout(function () {
            notifTitle.innerHTML = 'title';
            notifDesc.innerHTML = 'desc';
            notifParent.style.display = 'none';
        }, 1200);
    }, 1000);
}

recordVCBtn.addEventListener('click', function () {
    const userUID = auth.currentUser.uid;
    //disable button
    recordVCBtn.setAttribute('disabled', true);

    //set the command that is being recorded to the db
    const vcToRecord = recordVCDD.value;
    set(ref(db, '/vc_user/' + userUID + '/current'), vcToRecord).then(() => {
    }).catch((err) => {
        console.log("ERROR: ", err.message);
    })

    //set false to the done branch (on pi update, it will be true and button will be renabled)
    var doneRecord = false;
    set(ref(db, '/vc_user/' + userUID + '/doneRec'), doneRecord).then(() => {
    }).catch((err) => {
        console.log("ERROR: ", err.message);
    })
})


//GENERAL GLOBAL FUNCTIONS
function removeAllChildElements(parentElementID) {
    parentElementID.querySelectorAll('*').forEach(n => n.remove());
}

//Trim invalid values (used in layout name)
function trimName(name) {
    return name.replace(/\s/g, '_').replace(/[0-9]/g, '');
}

// Check for empty input field
function fieldIsEmpty(field) {
    if (field.value == null || field.value == "") {
        field.focus();
        field.style.borderColor = '#FF0000';
        return true;
    } else {
        field.style.borderColor = '#235268';
        return false;
    }
}

/* FIREBASE FUNCTIONS */
onAuthStateChanged(auth, (user) => {
    if (user) {
        const uid = user.uid;
        const userUID = auth.currentUser.uid;
        loginWindow.style.display = 'none';

        //CHECK IF VOICE IS DONE RECORDING
        const vcDoneRef = ref(db, 'vc_user/' + userUID + '/doneRec');
        onValue(vcDoneRef, (snapshot) => {
            if (snapshot.val() === true || snapshot.val() === null) {
                recordVCBtn.removeAttribute('disabled');
            } else {
                recordVCBtn.setAttribute('disabled', true);
            }
        })

        //Update vc status update span
        const vcStatusRef = ref(db, 'vc_user/' + userUID + '/recMsg');
        onValue(vcStatusRef, (snapshot) => {

            // if (snapshot.val()) {
            statusUpdateSpan.innerHTML = snapshot.val();
            // } else {
            // recordVCBtn.setAttribute('disabled', true);
            // }
        })

        //GET MASTER MODULE LOCATIONS
        const moduleLocationsRef = ref(db, 'module_locations');
        onValue(moduleLocationsRef, (snapshot) => {
            snapshot.forEach(function (location_element) {
                master_moduleLocations[location_element.val()] = location_element.key;
            })
        })

        //GET MASTER MODULE NAMES
        const modulesRef = ref(db, 'modules');
        onValue(modulesRef, (snapshot) => {
            snapshot.forEach(function (module_element) {
                master_modules[module_element.val()] = module_element.key;
            })
        })

        //LOAD LAYOUTS AND CREATE ELEMENTS IN LAYOUTS DIV
        const userLayoutsRef = ref(db, 'layouts/' + userUID + '/');
        onValue(userLayoutsRef, (snapshot) => {
            //clear elements to remake them
            removeAllChildElements(parentOfHomeLayouts);
            snapshot.forEach(function (layout_name) {
                userHomeLayouts(layout_name);
            })
            //FOR LAYOUTS SET DD

            var layout_dd_blank_option = document.createElement('option');
            layout_dd_blank_option.setAttribute('value', '');
            layout_dd_blank_option.textContent = '';
            layoutSetDD.appendChild(layout_dd_blank_option);

            master_layoutNames.forEach(function layoutNamecallback(master_layoutNames, index_location) {
                var layout_dd_option = document.createElement('option');
                layout_dd_option.value = master_layoutNames;
                layout_dd_option.textContent = master_layoutNames;
                layoutSetDD.appendChild(layout_dd_option);
            })

            layoutSetDD.addEventListener('change', function () {
                const userUID = auth.currentUser.uid;
                set(ref(db, '/user_curr_layout/' + userUID), layoutSetDD.value).then(() => {
                    alert("Set Layout to " + layoutSetDD.value);
                    location.reload();
                }).catch((err) => {
                    alert("error setting");
                    console.log("ERROR: ", err.message);
                })
            })

            //END FOR LAYOUTS SET DD
        })

        const currentLayoutRef = ref(db, '/user_curr_layout/' + userUID + '/');
        onValue(currentLayoutRef, (snapshot) => {
            currentLayoutSetSpan.innerHTML = "Current: ";
            if (snapshot.exists) {
                currentLayoutSetSpan.innerHTML += snapshot.val();
            }
            
        })

        //GET NAMES OF LAYOUTS THAT ARE SET FOR CUSTOM COMMANDS
        const vcLayoutsRef = ref(db, 'vc_user/' + userUID);
        onValue(vcLayoutsRef, (snapshot) => {
            snapshot.forEach(function (layoutsName_element) {
                master_vc_layouts[layoutsName_element.key] = layoutsName_element.val();
            })
        })

        //GET VOICE COMMANDS AND MAKE VC MODULES
        const voicecommandsRef = ref(db, 'vc_def');
        onValue(voicecommandsRef, (snapshot) => {
            snapshot.forEach(function (voice_command) {
                master_voiceCommands[voice_command.val()] = voice_command.key;
            })
            master_voiceCommands.forEach(function locationcallback(master_voiceCommand, index_location) {
                if (index_location >= 0 && index_location <= 3) {
                    //4 def
                    defVoiceCommandContainers(master_voiceCommand, index_location);
                } else if (index_location >= 4 && index_location <= 7) {
                    //3 user
                    userVoiceCommandContainers(master_voiceCommand, index_location);
                }
            })
        })




        //CREATE CLICKABLE DIV IN GRID FOR EACH LAYOUT (CONTAINS MODULE DATA)
        function userHomeLayouts(layoutData) {
            const userLayoutName = layoutData.key;
            var userCreatedLayout = document.createElement('div');
            var userCL_ID = 'layout-' + userLayoutName;
            userCreatedLayout.setAttribute('class', 'layout-boxes');
            userCreatedLayout.setAttribute('id', userCL_ID);
            userCreatedLayout.innerHTML += userLayoutName;

            //keep track of layout names for vc dropdowns
            master_layoutNames[master_layoutNames.length] = userLayoutName;

            userCreatedLayout.addEventListener('click', function () {
                newLayoutContainer.style.visibility = 'visible';
                const input_layoutName = document.getElementById('new-layout-name-p');
                const submitLayoutBtn = document.getElementById('new-layout-submit');
                submitLayoutBtn.innerHTML = 'Edit Layout';
                input_layoutName.value = layoutData.key;
                master_modules.forEach(function namecallback(master_moduleName, index_moduleName) {
                    var module_input = document.createElement('input');
                    const module_input_id = 'module-' + index_moduleName;
                    module_input.setAttribute('type', 'checkbox');
                    module_input.setAttribute('name', module_input_id);
                    module_input.setAttribute('class', 'layout-modules');
                    module_input.setAttribute('id', module_input_id);

                    var module_label = document.createElement('label');
                    const module_label_id = 'label-' + index_moduleName;
                    module_label.setAttribute('id', module_label_id);
                    module_label.setAttribute('for', module_input_id);
                    module_label.setAttribute('class', 'module-labels');
                    module_label.textContent = master_moduleName;

                    var module_dropdown = document.createElement('select')
                    const module_dropdown_id = 'dd-' + index_moduleName;
                    module_dropdown.setAttribute('name', module_dropdown_id);
                    module_dropdown.setAttribute('id', module_dropdown_id);
                    module_dropdown.setAttribute('class', 'module-dropdown');
                    module_dropdown.setAttribute('disabled', true);

                    var dd_blank_option = document.createElement('option');
                    dd_blank_option.setAttribute('value', '');
                    dd_blank_option.textContent = '';
                    module_dropdown.appendChild(dd_blank_option);

                    master_moduleLocations.forEach(function locationcallback(master_moduleLocations, index_location) {
                        var dd_option = document.createElement('option');
                        dd_option.value = master_moduleLocations;
                        dd_option.textContent = master_moduleLocations;
                        module_dropdown.appendChild(dd_option);
                    })

                    module_input.addEventListener('change', function () {
                        if (this.checked) {
                            module_label.style.backgroundColor = "#eb7e62";
                            module_dropdown.removeAttribute('disabled');
                            enabledModulesArr[index_moduleName] = master_moduleName;
                        } else {
                            module_label.style.backgroundColor = "#8dcbcd";
                            module_dropdown.value = 0;
                            enabledModulesLocationArr[index_moduleName] = '';
                            module_dropdown.setAttribute('disabled', true);
                            enabledModulesArr[index_moduleName] = '';
                        }

                    });

                    module_dropdown.addEventListener('change', function () {
                        enabledModulesLocationArr[index_moduleName] = module_dropdown.value;
                    })

                    if (layoutData.hasChildren()) {
                        layoutData.forEach(function (elements) {
                            if (elements.key == master_moduleName) {
                                //will set module_input checked, it acts as expected with this.
                                module_input.checked = true;
                                module_label.style.backgroundColor = "#eb7e62";
                                module_dropdown.removeAttribute('disabled');
                                enabledModulesArr[index_moduleName] = master_moduleName;

                                //populate dropdown with correct value
                                module_dropdown.value = elements.val();
                                enabledModulesLocationArr[index_moduleName] = module_dropdown.value;
                            }
                        })
                    }
                    parentOfLayoutModules.appendChild(module_input);
                    parentOfLayoutModules.appendChild(module_label);
                    parentOfLayoutModules.appendChild(module_dropdown);
                })
            })
            parentOfHomeLayouts.appendChild(userCreatedLayout);
        }
    } else {
        console.log("USER OUT");
        loginWindow.style.display = 'flex';
        //Make login window visible

    }
});

function defVoiceCommandContainers(defVcName, defIndex) {
    var vc_def_container = document.createElement('div');
    const vc_def_container_id = 'vc-def-' + defIndex + '-inner-container';
    vc_def_container.setAttribute('class', 'vc-inner-containers');
    vc_def_container.classList.add('vc-def-inner-containers');
    vc_def_container.setAttribute('id', vc_def_container_id);

    var vc_def_name = document.createElement('div');
    const vc_def_name_id = 'vc-def-' + defIndex + '-name';
    vc_def_name.setAttribute('id', vc_def_name_id);
    vc_def_name.setAttribute('class', 'vc-def-element');
    vc_def_name.innerHTML = 'REC_' + defIndex + ':\t' + defVcName;

    vc_def_container.appendChild(vc_def_name);
    parentVoiceCommandContainer.appendChild(vc_def_container);
}

function userVoiceCommandContainers(userVcName, userIndex) {
    var rec_number = 'REC_' + userIndex;
    var vc_user_container = document.createElement('div');
    const vc_user_container_id = 'vc-user-' + userIndex + '-inner-container';
    vc_user_container.setAttribute('class', 'vc-inner-containers');
    vc_user_container.classList.add('vc-user-inner-containers');
    vc_user_container.setAttribute('id', vc_user_container_id);

    var vc_user_name = document.createElement('div');
    const vc_user_name_id = 'vc-user-' + userIndex + '-name';
    vc_user_name.setAttribute('id', vc_user_name_id);
    vc_user_name.setAttribute('class', 'vc-user-element');
    vc_user_name.innerHTML = rec_number + ':  ' + userVcName + ':  ';

    // var vc_user_desc = document.createElement('div');
    // const vc_user_desc_id = 'vc-user-' + userIndex + '-desc';
    // vc_user_desc.setAttribute('id', vc_user_desc_id);
    // vc_user_desc.setAttribute('class', 'vc-user-element');
    // vc_user_desc.innerHTML = '\tLayout: ';

    var vc_layout_input = document.createElement('input');
    const vc_layout_input_id = 'vc-layout-' + userIndex + '-input';
    vc_layout_input.setAttribute('id', vc_layout_input_id);
    vc_layout_input.setAttribute('class', 'vc-input-element');
    vc_layout_input.setAttribute('type', 'text');
    vc_layout_input.setAttribute('disabled', true);
    vc_layout_input.setAttribute('placeholder', master_vc_layouts[userIndex]);

    var vc_user_dropdown = document.createElement('select')
    const vc_user_dropdown_id = 'dd-' + userIndex;
    vc_user_dropdown.setAttribute('name', vc_user_dropdown_id);
    vc_user_dropdown.setAttribute('id', vc_user_dropdown_id);
    vc_user_dropdown.setAttribute('class', 'vc-user-element');
    vc_user_dropdown.classList.add('vc-user-dropdown');

    var vc_dd_blank_option = document.createElement('option');
    vc_dd_blank_option.setAttribute('value', '');
    vc_dd_blank_option.textContent = '';
    vc_user_dropdown.appendChild(vc_dd_blank_option);






    master_layoutNames.forEach(function layoutNamecallback(master_layoutNames, index_location) {
        var vc_dd_option = document.createElement('option');
        vc_dd_option.value = master_layoutNames;
        vc_dd_option.textContent = master_layoutNames;
        vc_user_dropdown.appendChild(vc_dd_option);
    })

    vc_user_dropdown.addEventListener('change', function () {
        const userUID = auth.currentUser.uid;
        set(ref(db, '/vc_user/' + userUID + '/' + userIndex), vc_user_dropdown.value).then(() => {
            alert("Changed " + rec_number + " layout to " + vc_user_dropdown.value);
            location.reload();
        }).catch((err) => {
            alert('Error, check connection');
            console.log("ERROR: ", err.message);
        })
    })



    //if the value is set

    vc_user_container.appendChild(vc_user_name);
    // vc_user_container.appendChild(vc_user_desc);
    vc_user_container.appendChild(vc_layout_input);
    vc_user_container.appendChild(vc_user_dropdown);
    parentVoiceCommandContainer.appendChild(vc_user_container);

}

/* LAYOUTS SECTION */
//Actual User layout Modules in top functions

//NEW LAYOUT BUTTON (ON MAIN PAGE)
newLayoutBtn.addEventListener('click', function () {
    //make container visible
    newLayoutContainer.style.visibility = 'visible';
    const submitLayoutBtn = document.getElementById('new-layout-submit');
    submitLayoutBtn.innerHTML = 'Create Layout';
    master_modules.forEach(function namecallback(master_moduleName, index_moduleName) {
        var module_input = document.createElement('input');
        const module_input_id = 'module-' + index_moduleName;
        module_input.setAttribute('type', 'checkbox');
        module_input.setAttribute('name', module_input_id); //COULD BE THE PROBLEM
        module_input.setAttribute('class', 'layout-modules');
        module_input.setAttribute('id', module_input_id);

        var module_label = document.createElement('label');
        const module_label_id = 'label-' + index_moduleName;
        module_label.setAttribute('id', module_label_id);
        module_label.setAttribute('for', module_input_id);
        module_label.setAttribute('class', 'module-labels');
        module_label.textContent = master_moduleName;

        var module_dropdown = document.createElement('select')
        const module_dropdown_id = 'dd-' + index_moduleName;
        module_dropdown.setAttribute('name', module_dropdown_id); //COULD BE THE PROBLEM
        module_dropdown.setAttribute('id', module_dropdown_id);
        module_dropdown.setAttribute('class', 'module-dropdown');
        module_dropdown.setAttribute('disabled', true);

        var dd_blank_option = document.createElement('option');
        dd_blank_option.setAttribute('value', '');
        dd_blank_option.textContent = '';
        module_dropdown.appendChild(dd_blank_option);

        master_moduleLocations.forEach(function locationcallback(master_moduleLocations, index_location) {
            var dd_option = document.createElement('option');
            dd_option.value = master_moduleLocations;
            dd_option.textContent = master_moduleLocations;
            module_dropdown.appendChild(dd_option);
        })

        module_input.addEventListener('change', function () {
            if (this.checked) {
                module_label.style.backgroundColor = "#eb7e62";
                module_dropdown.removeAttribute('disabled');
                enabledModulesArr[index_moduleName] = master_moduleName;
            } else {
                module_label.style.backgroundColor = "#8dcbcd";
                module_dropdown.value = 0;
                enabledModulesLocationArr[index_moduleName] = '';
                module_dropdown.setAttribute('disabled', true);
                enabledModulesArr[index_moduleName] = '';
            }

        });

        module_dropdown.addEventListener('change', function () {
            enabledModulesLocationArr[index_moduleName] = module_dropdown.value;
        })
        parentOfLayoutModules.appendChild(module_input);
        parentOfLayoutModules.appendChild(module_label);
        parentOfLayoutModules.appendChild(module_dropdown);
    })
});
// SET LAYOUT DROPDOWN

//NEW LAYOUT/EDIT LAYOUT DIV
/* CREATING LAYOUTS */
//CANCEL BUTTON (IN DIV)
cancelLayout.addEventListener('click', function () {
    //remove all elements that were created when the div was shown
    var layoutParent = document.getElementById('new-layout-options-inner-container');
    var inputLayoutName = document.getElementById('new-layout-name-p');
    inputLayoutName.value = '';
    //remove all elements from popup new layout div
    removeAllChildElements(layoutParent);
    //hide the div
    newLayoutContainer.style.visibility = 'hidden';
    //clear enabledmodules array
    enabledModulesArr = [];

})
//CREATE LAYOUT/EDIT LAYOUT BUTTON (IN DIV)
submitLayout.addEventListener('click', function () {
    //get layoutName
    const input_layoutName = document.getElementById('new-layout-name-p');
    const trimmedLayoutName = trimName(input_layoutName.value);

    //push all those to database under layouts > uid > layout name > module: location
    if (!fieldIsEmpty(input_layoutName)) {

        const userUID = auth.currentUser.uid;
        for (var i = 0; i < enabledModulesArr.length; i++) {
            //If it is not enabled, the null value will remove the module from the layout.
            if (!enabledModulesArr[i]) {
                enabledModulesLocationArr[i] = null;
            }

            set(ref(db, '/layouts/' + userUID + '/' + trimmedLayoutName + '/' + enabledModulesArr[i]), enabledModulesLocationArr[i]).then(() => {
                //Done pushing, close popup and remove elements (they are created everytime the popup is opened)
                removeAllChildElements(parentOfLayoutModules);
                newLayoutContainer.style.visibility = 'hidden';
                sendNotif('Success!', 'Layout Submitted');
                location.reload();
            }).catch((err) => {
                console.log("ERROR: ", err.message);
                sendNotif('Error!', 'Layout not created, check connection');
            })
        }

    }
})

/* SETTINGS PAGE */
//SETTINGS BUTTON
settingsBtn.addEventListener('click', function () {
    var settings_state = document.getElementById('settings-container');
    if (settings_state.style.visibility == 'hidden' || settings_state == null || settings_state == "") {
        settings_state.style.visibility = 'visible';
    } else {
        settings_state.style.visibility = 'hidden';
    }
})
//SIGN OUT BUTTON
signOutBtn.addEventListener('click', function () {
    signOut(auth).then(() => {
        window.location.reload();
    }).catch((err) => {
        console.log("ERROR SIGNING OUT: ", err.message);
    })
})
//SIGN OUT CANCEL
signOutCancel.addEventListener('click', function () {
    var settings_state = document.getElementById('settings-container');
    if (settings_state.style.visibility == 'hidden' || settings_state == null || settings_state == "") {
        settings_state.style.visibility = 'visible';
    } else {
        settings_state.style.visibility = 'hidden';
    }
})
//Mirror ID Btn
mirrorIdDD.addEventListener('change', function () {
    const ddValue = mirrorIdDD.value;
    //push user id to mirror_id > Aph0:useruid
    if (ddValue == 'Aph0') {
        const userUsing = auth.currentUser.uid;
        set(ref(db, '/mirror_id/Aph0'), userUsing).then(() => {
            alert("User: " + auth.currentUser.displayName + " is now using Aph0");
            document.getElementById('settings-container').style.visibility = 'hidden';
        }).catch((err) => {
            console.log("ERROR: ", err.message);
        })

    } else {
        //remove user id from mirror_ifd
        const notUsing = "noUser"
        set(ref(db, '/mirror_id/Aph0'), notUsing).then(() => {
        }).catch((err) => {
            console.log("ERROR: ", err.message);
        })
    }


})

/* LOGIN AND REGISTRATION DIV */
//SWITCH BETWEEN LOGIN AND REG IN DIV
loginRegSwitchBtn.onclick = function () {
    const formInputs = document.getElementsByClassName('form-inputs');
    for (var i = 0; i < formInputs.length; i++) {
        formInputs[i].style.borderColor = '#235268';
    }
    if (loginRegSwitchBtn.checked) {
        // Show registration Stuff
        document.getElementById('form-header').textContent = "Register";
        document.getElementById('lr-switch-label-span').textContent = "Login?"
        document.getElementById('full_name').style.display = "inherit";
        document.getElementById('conf_password').style.display = "inherit";
        document.getElementById('form-submit-btn').textContent = "Register";
    } else {
        // show login stuff
        document.getElementById('form-header').textContent = "Login";
        document.getElementById('lr-switch-label-span').textContent = "Register?"
        document.getElementById('full_name').style.display = "none";
        document.getElementById('conf_password').style.display = "none";
        document.getElementById('form-submit-btn').textContent = "Login";
        // const signinUser = document.querySelector('form-signin');
    }
}

//SIGN USER UP/IN
const signupUser = document.querySelector('.form-signin');
signupUser.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = signupUser.full_name;
    const email = signupUser.email;
    const password = signupUser.password;
    const conf_password = signupUser.conf_password;
    if (loginRegSwitchBtn.checked) {
        //REGISTER
        if (!fieldIsEmpty(name) && !fieldIsEmpty(email) && !fieldIsEmpty(password) && !fieldIsEmpty(conf_password)) {
            createUserWithEmailAndPassword(auth, email.value, password.value)
                .then((cred) => {
                    updateProfile(auth.currentUser, {
                        displayName: name.value
                    }).then(() => {
                        console.log('Welcome ', cred.user.displayName);
                        document.getElementById('form-submit-btn-label').textContent = '';
                        signupUser.reset();
                    }).catch((err) => {
                        console.log('ERROR: ', err.message);
                    })
                })
                .catch((err) => {
                    console.log(err.message);
                    document.getElementById('form-submit-btn-label').textContent = err.message;
                })
        }
    } else {
        //LOGIN
        if (!fieldIsEmpty(email) && !fieldIsEmpty(password)) {
            signInWithEmailAndPassword(auth, email.value, password.value)
                .then((cred) => {
                    const user = cred.user;
                    document.getElementById('form-submit-btn-label').textContent = '';
                    signupUser.reset();
                    loginWindow.style.display = 'none';
                })
                .catch((err) => {
                    console.log('ERROR: ', err.message);
                    document.getElementById('form-submit-btn-label').textContent = err.message;
                })
        }
    }
})

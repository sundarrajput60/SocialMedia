$(document).ready(function () {
    // Function to display image preview
    function readURL(input, previewElementId) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                $(previewElementId).attr('src', e.target.result);
            }
            reader.readAsDataURL(input.files[0]);
        }
    }

    // Event listener for profile photo change
    $('.upload-photo').change(function () {
        readURL(this, '#imgEditUserProfilePic');
    });

    // Event listener for banner change
    $('.upload-banner').change(function () {
        readURL(this, '#imgEditUserProfileBgPic');
    });

    $('#btnSaveEditprofile').click(function (e) {
        e.preventDefault();

        var updateSuccess = 1;

        const userName = $('#txtUserName').val().trim();
        const name = $('#txtName').val().trim();
        const email = $('#txtEmail').val().trim();
        const country = $('#selectCountry').val().trim();
        const bio = $('#txtBio').val().trim();
        const dob = $('#dobPicker').val().trim();
        const gender = $('input[name="gender"]:checked').val();

        const namePattern = /^[a-zA-Z0-9\s]*$/;
        const userNamePattern = /^[a-zA-Z0-9_]+$/;
        //const userNamePattern = /(^|[^@\w])@(\w{1,15})\b/g;
        const emailPattern = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

        // Clear previous error messages
        $('.error-msg').html("");

        // Validate UserName
        if (userName === '') {
            $('<div class="error-msg text-red-500">Username can\'t be empty</div>').insertAfter('#txtUserName');
            updateSuccess = 0;
        } else if (!userNamePattern.test(userName)) {
            $('<div class="error-msg text-red-500">Username should only contain characters, underscores and numbers</div>').insertAfter('#txtUserName');
            updateSuccess = 0;
        } else if (userName === 'Twitter' || userName === 'twitter' || userName === 'Admin' || userName === 'admin') {
            $('<div class="error-msg text-red-500">Username can\'t be twitter or admin</div>').insertAfter('#txtUserName');
            updateSuccess = 0;
        } else if (userName.length < 4) {
            $('<div class="error-msg text-red-500">Username must have atleast 4 characters</div>').insertAfter('#txtUserName');
            updateSuccess = 0;
        }


        // Validate Name
        if (name === '') {
            $('<div class="error-msg text-red-500">Name can\'t be empty</div>').insertAfter('#txtName');
            updateSuccess = 0;
        } else if (!namePattern.test(name)) {
            $('<div class="error-msg text-red-500">Name should only contain letters and spaces</div>').insertAfter('#txtName');
            updateSuccess = 0;
        }

        // Validate Email
        if (email === '') {
            $('<div class="error-msg text-red-500">Email can\'t be empty</div>').insertAfter('#txtEmail');
            updateSuccess = 0;
        } else if (!emailPattern.test(email)) {
            $('<div class="error-msg text-red-500">Enter a valid email</div>').insertAfter('#txtEmail');
            updateSuccess = 0;
        }

        // Validate Date of Birth
        if (dob === '') {
            $('<div class="error-msg text-red-500">Date of Birth can\'t be empty</div>').insertAfter('#dobPicker');
            updateSuccess = 0;
        }

        var today = new Date().toISOString().split('T')[0];
        // Set the max attribute of the date input to today's date
        $('#dobPicker').attr('max', today);


        // Validate the selected date
        if (dob > today) {
          
            $('<div class="error-msg text-red-500">Birthdate can\'t be future date </div>').insertAfter('#dobPicker');
            updateSuccess = 0;
        }


        // Validate Gender
        if (!gender) {
            $('<div class="error-msg text-red-500">Please select a gender</div>').insertAfter('#divGender');
            updateSuccess = 0;
        }

        // Validate Biography
        if (bio.length > 160) {
            $('<div class="error-msg text-red-500">Biography should not exceed 160 characters</div>').insertAfter('#txtBio');
            updateSuccess = 0;
        }

        if (updateSuccess === 1) {
            // Prepare form data
            var formData = new FormData();
            formData.append('UserName', userName);
            formData.append('FirstName', name);
            formData.append('Gender', gender);
            formData.append('DateOfBirth', dob);
            formData.append('UserEmail', email);
            formData.append('Country', country);
            formData.append('Bio', bio);

            if ($('#upload-photo')[0].files[0] == null) {
                formData.append('ProfilePic', $('#txtProfilePicPath').val());
            } else {
                formData.append('ProfilePic', $('#upload-photo')[0].files[0]);
            }

            if ($('#upload-banner')[0].files[0] == null) {
                formData.append('ProfileBgPic', $('#txtProfileBgPicPath').val());
            } else {
                formData.append('ProfileBgPic', $('#upload-banner')[0].files[0]);
            }

            // Send form data via AJAX
            $.ajax({
                url: '/Profile/UpdateProfileData',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (response) {
                    console.log(response)
                    var success = 1;
                    if (response.UsernameUpdated == false) {
                        $('<div class="error-msg text-red-500">Username already exist</div>').insertAfter('#txtUserName');
                        success = 0;
                    }
                    else {
                        $('<div class="error-msg text-red-500"></div>').insertAfter('#txtUserName'); 
                    }

                    if (response.EmailUpdated == false) {
                        $('<div class="error-msg text-red-500">Email already exist</div>').insertAfter('#txtEmail');
                        success = 0;
                    }
                    else {
                        $('<div class="error-msg text-red-500"></div>').insertAfter('#txtEmail');  
                    }
                    console.log(success);
                    if (success == 1) {
                        
                        Swal.fire({
                            position: "center",
                            icon: "success",
                            title: "Profile data updated.",
                            showConfirmButton: false,
                            timer: 1500
                        });
                        window.location.href = '/Profile/UserProfile';
                    }

                },
                error: function (err) {
                    Swal.fire({
                        position: "center",
                        icon: "error",
                        title: "Profile data not updated.",
                        showConfirmButton: false,
                        timer: 1500
                    });
                }
            });
        }
    });
});

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
    $('#upload-photo').change(function () {
        readURL(this, '#imgEditUserProfilePic');
    });

    // Event listener for banner change
    $('#upload-banner').change(function () {
        readURL(this, '#imgEditUserProfileBgPic');
    });

    $('#btnSaveEditprofile').click(function (e) {
        e.preventDefault();

        var flag = 0;

        const name = $('#txtName').val().trim();
        const email = $('#txtEmail').val().trim();
        const country = $('#txtCountry').val().trim();
        const bio = $('#txtBio').val().trim();
        const dob = $('#dobPicker').val().trim();
        const gender = $('input[name="gender"]:checked').val();

        const namePattern = /^[a-zA-Z0-9\s]*$/;
        const emailPattern = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

        // Clear previous error messages
        $('.error-msg').html("");

        // Validate Name
        if (name === '') {
            $('<div class="error-msg text-red-500">Name can\'t be empty</div>').insertAfter('#txtName');
            flag = 1;
        } else if (!namePattern.test(name)) {
            $('<div class="error-msg text-red-500">Name should only contain letters and spaces</div>').insertAfter('#txtName');
            flag = 1;
        }

        // Validate Email
        if (email === '') {
            $('<div class="error-msg text-red-500">Email can\'t be empty</div>').insertAfter('#txtEmail');
            flag = 1;
        } else if (!emailPattern.test(email)) {
            $('<div class="error-msg text-red-500">Enter a valid email</div>').insertAfter('#txtEmail');
            flag = 1;
        }

        // Validate Date of Birth
        if (dob === '') {
            $('<div class="error-msg text-red-500">Date of Birth can\'t be empty</div>').insertAfter('#dobPicker');
            flag = 1;
        }

        // Validate Gender
        if (!gender) {
            $('<div class="error-msg text-red-500">Please select a gender</div>').insertAfter('#divGender');
            flag = 1;
        }

        // Validate Country
        if (country === '') {
            $('<div class="error-msg text-red-500">Country can\'t be empty</div>').insertAfter('#txtCountry');
            flag = 1;
        }

        // Validate Biography
        if (bio.length > 160) {
            $('<div class="error-msg text-red-500">Biography should not exceed 160 characters</div>').insertAfter('#txtBio');
            flag = 1;
        }

        if (flag === 0) {
            // Prepare form data
            var formData = new FormData();
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

                    if (response === -1) {
                        $('<div class="error-msg text-red-500">Email already exist</div>').insertAfter('#txtEmail');
                    }
                    else {
                        $('<div class="error-msg text-red-500"></div>').insertAfter('#txtEmail');
                        window.location.href = '/Profile/UserProfile';
                    }                   
                },
                error: function (err) {

                    console.log(err);
                }
            });
        }
    });
});

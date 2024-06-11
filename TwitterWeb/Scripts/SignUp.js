$(document).ready(function () {
    $('#btnSignup').click(function (e) {
       
        var flag = 0;
        const userName = $('#txtUserName').val().trim();
        const email = $('#txtEmail').val().trim();
        const password = $('#txtPassword').val().trim();

        const namePattern = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
        const emailPattern = /[a-zA-z0-9_\-\.]+[@][a-z]+[\.][a-z]{2,3}/;
        //const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*_=+-]).{8,12}$/;

        // Validate Username
        if (userName === '') {
            $('#spn-error-msg-username').html("Username can't be empty");
            flag = 1;

        } else if (userName.length < 4) {
            $('#spn-error-msg-username').html("Username must have atleast 4 characters");
            flag = 1;

        }
        else if (!isNaN(userName) || namePattern.test(userName)) {
            $('#spn-error-msg-username').html("Numbers & special characters are not allowed");
            flag = 1;

        } else {
            $('#spn-error-msg-username').html("");
            flag = 0;
        }

        // Validate Email
        if (email === '') {
            $('#spn-error-msg-email').html("Email can't be empty");
            flag = 1;

        } else if (!email.match(emailPattern)) {
            $('#spn-error-msg-email').html("Enter valid email");
            flag = 1;

        } else {
            $('#spn-error-msg-email').html("");
            flag = 0;
        }

        // Validate Password
        if (password === '') {
            $('#spn-error-msg-password').html("Password can't be empty");
            flag = 1;

        } else if (password.length < 8 || password.length > 12) {
            $('#spn-error-msg-password').html("Password must be 8 to 12 characters long");
            flag = 1;

        } else {
            $('#spn-error-msg-password').html("");
            flag = 0;
        }

      
        if (flag == 0) {

            var SignUpObj = {

                UserName: $('#txtUserName').val(),
                UserPassword: $('#txtPassword').val(),
                UserEmail: $('#txtEmail').val()
            }


            $.ajax({
                url: '/api/SignUpApi/AddUser',
                type: 'POST',
                data: JSON.stringify(SignUpObj),
                dataType: 'json',
                contentType: 'application/json; charset=utf-8',
                beforeSend: function () {
                    // Show loading dialog
                    Swal.fire({
                        title: "Signing up...",
                        html: "Please wait, we are working on it.",
                        timerProgressBar: true,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });
                },
                success: function (res) {
                    Swal.close(); // Close the loading dialog

                    if (res == 1) {
                        $('#spn-error-msg-username').html("Username already used");
                    } else if (res == 2) {
                        $('#spn-error-msg-email').html("Email already used");
                    } else if (res == 3) {
                        $('#spn-error-msg-username').html("Username already used");
                        $('#spn-error-msg-email').html("Email already used");
                    } else {
                        $('#spn-error-msg-username').html("");
                        $('#spn-error-msg-email').html("");
                    }

                    var newUserId = res.newUser ? res.newUser.UserId : null;
                    if (newUserId != null) {
                        Swal.fire({
                            position: "center",
                            icon: "info",
                            title: "Please Verify OTP",
                            showConfirmButton: false,
                            timer: 1500
                        }).then(() => {
                            window.location.href = '/Signup/NewUserVerification?id=' + newUserId;
                        });
                    }
                },
                error: function (err) {
                    Swal.close(); // Close the loading dialog

                    if (err.status === 500) {
                        $('#spn-error-msg-email').html("We are sorry, unable to process your request");
                    } else {
                        $('#spn-error-msg-email').html("");
                    }
                }
            });

        }
    });
});
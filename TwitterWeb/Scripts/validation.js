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
                success: function (res) {

                    ClearForm();
                    window.location.href = '/Login/Index';
                },
                error: function (err) {
                    if (err.status === 500) {
                        $('#spn-error-msg-email').html("Email already used");
                    }
                    else {
                        $('#spn-error-msg-email').html("");
                    }
                }
            });
        }
    });
});
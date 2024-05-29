//lOGIN
$(document).ready(function () {
    $('#btnLogin').click(function () {

        var LoginObj = {
            UserName: $('#txtUserName').val(),
            UserPassword: $('#txtPassword').val()
        };

        $.ajax({
            url: '/api/LoginApi/CheckUser',
            type: 'POST',
            data: JSON.stringify(LoginObj),
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            success: function (res) {

                var id = res;
                ClearForm();
                window.location.href = "/Homepage/GetUser?id=" + id;
            },
            error: function (error) {
                if (error.status === 400) {
                    $('#spnErrorMsg').html("Invalid username or password");
                }
            }
        });
    });

    function ClearForm() {

        $('#txtUserName').val('');
        $('#txtPassword').val('');
        $('#txtEmail').val('');
    }
});
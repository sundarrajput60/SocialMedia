﻿var currentUser;
$(document).ready(function () {

    //LOAD ALL TWEETS
    $('#divMainContentBody').ready(function () {

        getNavbarUserData();
        var hashtagName = localStorage.getItem('hashtagName');
        if (hashtagName != null) {

            appendTweetByHashtag(hashtagName);
            localStorage.clear();
        }
        else {

            getAllTweets();
        }

        topHashtag();
        getUserProfileData();
        userFriends();
    });

    function getAllTweets() {

        $.ajax({
            url: '/Homepage/GetAllTweets',
            type: 'GET',
            beforeSend: function () {
                showLoader();
            },
            success: function (response) {
                var loggedInUserId = response.loggedInUserId.userId;
                currentUser = response.loggedInUserId.userId;
                var tweets = response.Tweets;

                // Clear the existing comments before appending new ones
                $('.comments').empty();

                tweets.forEach(function (tweet) {
                    appendTweetToPage(tweet, loggedInUserId, 'divUserTweet');
                    // Check if there are comments and append them
                    if (tweet.Comments && tweet.Comments.length > 0) {
                        tweet.Comments.forEach(function (comment) {
                            prependComment(comment, tweet.TweetId, tweet);
                            if (comment.Replies && comment.Replies.length > 0) {
                                comment.Replies.forEach(function (reply) {
                                    prependReply(reply, comment.CommentId, tweet.TweetId, tweet);
                                });
                            }
                        });
                    }
                });

                if (response.Tweets == "") {
                    $('#divUserTweet').append('<div class="text-center mt-20 mb-20 pt-20 pb-20 dark:text-white dark:bg-black-0">No tweets found! Make friends to see thier tweets.</div>');
                }
            },
            complete: function () {
                hideLoader();
            },
            error: function () {
                // Handle error

            }
        });
    }

    function getNavbarUserData() {

        $.ajax({
            url: '/Homepage/GetNavbarUserData',
            type: 'GET',
            data: { userId: currentUser },
            success: function (response) {

                $('#navBarName').html(response.FirstName);
                $('#navBarUserName').html('@' + response.UserName);
                $('#navBarNameProfile').attr("src", response.ProfilePic);
            }
        });
    }

    //COMMENT ON TWEET 
    $('#divUserTweet').ready(function () {
        // Open the modal
        function openModal() {
            $('#spnCommentModal').html('');
            $('#commentText').val('');
            $('#commentModal').removeClass('hidden');
        }

        // Close the modal
        function closeModal() {
            $('#spnCommentModal').html('');
            $('#commentText').val('');
            $('#commentModal').addClass('hidden');
        }

        // Event listener to close the modal when the close buttons are clicked
        $('.closeModalBtn').on('click', closeModal);

        // COMMENT TWEET
        $(document).on('click', '.comment-btn', function () {
            // Get the tweetId from the data attribute
            var tweetId = $(this).data('tweet-id');
            // Set the hidden fields in the modal
            $('#modalLoggedInUserId').val(currentUser);
            $('#modalTweetId').val(tweetId);

            // Open the modal
            openModal();
        });

        // COMMENT TWEET AJAX
        $(document).on('click', '#submitCommentBtn', function () {
            var loggedInUserId = $('#modalLoggedInUserId').val();
            var tweetId = $('#modalTweetId').val();
            var commentText = $('#commentText').val();


            if (commentText.trim() == '') {
                $('#spnCommentModal').html("Comment can't be empty!");
            }
            else {
                $('#spnCommentModal').html('');
                $.ajax({
                    url: '/Homepage/UserCommentTweet',
                    type: 'POST',
                    data: {
                        userId: loggedInUserId,
                        tweetId: tweetId,
                        commentText: commentText
                    },
                    success: function (response) {
                        $('#commentText').val('');
                        if (response.success) {
                            prependComment(response.comment, tweetId, 'comments-' + tweetId);
                            // Update comment count if necessary
                            updateCommentCount(tweetId, response.commentCount);

                        }
                    },
                    error: function () {
                        // Handle error
                        $('#commentText').val('');
                    }

                });
                closeModal();
            }

        });
    });

    // UPDATE COMMENT COUNT
    function updateCommentCount(tweetId, newCount) {
        var commentCountElem = $(`#tweet-${tweetId} .comment-count`);
        commentCountElem.text(newCount);
        commentCountElem.data('comment-count', newCount);
    }

    // DELETE COMMENT BUTTON
    $(document).on('click', '.delete-comment-btn', function () {
        var commentId = $(this).data('comment-id'); // Retrieve comment ID from the data attribute
        var commentElement = $(this).closest('.comments');
        var repliesContainer = $('#replies-' + commentId);

        Swal.fire({
            title: "Are you sure? You want to delete this comment!",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        }).then((result) => {
            if (result.isConfirmed) {
                // Send AJAX request to delete the comment
                $.ajax({
                    url: '/Homepage/DeleteComment',
                    type: 'GET',
                    data: { commentId: commentId },
                    success: function (response) {
                        if (response.success) {
                            // Upon successful deletion, remove the comment element and related replies from the DOM
                            commentElement.remove();
                            repliesContainer.remove();

                            // Update the comment count
                            updateCommentCount(response.tweetId, response.commentCount);
                        } else {
                            console.error(response.message);
                        }
                    },
                    error: function (xhr, status, error) {
                        console.error(error);
                    }
                });
                Swal.fire({
                    title: "Deleted!",
                    text: "Your comment has been deleted.",
                    icon: "success"
                });

            }
        });

    });

    // TWEET LIKE BUTTON
    $(document).on('click', '.like-btn', function () {
        var tweetId = $(this).data('tweet-id');
        var loggedInUserId = currentUser;
        var likeButton = $(this);
        var likeCount = likeButton.find('.like-count');

        $.ajax({
            url: '/Homepage/LikeCountTweet',
            type: 'POST',
            data: {
                tweetId: tweetId,
                userId: loggedInUserId
            },
            success: function (response) {
                var newLikeCount = response.likeCount;
                likeCount.text(newLikeCount);

                // Toggle the heart icon based on the current class
                var heartIcon = likeButton.find('svg');
                var heartPath = heartIcon.find('path');

                if (heartIcon.hasClass('fill-red-0')) {
                    heartIcon.removeClass('fill-red-0').addClass('fill-white stroke-red-500');
                    heartPath.attr('d', 'M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z');
                } else {
                    heartIcon.removeClass('fill-white stroke-red-500').addClass('fill-red-0');
                    heartPath.attr('d', 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z');
                }
            },
            error: function (xhr, status, error) {
                console.error(error);
            }
        });
    });

    // DELETE TWEET
    $(document).on('click', '.delete-btn', function () {
        var tweetId = $(this).data('tweet-id'); // Retrieve tweet ID from the data attribute
        var tweetElement = $(this).closest('.tweet-container');
        var tweetComment = $(tweetElement).next();
        var tweetCommentReply = $(tweetComment).children();

        Swal.fire({
            title: "Are you sure? You want to delete this tweet!",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        }).then((result) => {
            if (result.isConfirmed) {
                // Send AJAX request to delete the tweet
                $.ajax({
                    url: '/Homepage/DeleteTweet',
                    type: 'GET',
                    data: { tweetId: tweetId },
                    success: function (response) {
                        // Upon successful deletion, remove the tweet element from the DOM
                        tweetElement.remove();
                        tweetComment.remove();
                        tweetCommentReply.remove();
                        $('#divTopHashtag').empty();
                        topHashtag();
                    },
                    error: function (xhr, status, error) {
                        console.error(error);
                    }
                });

                Swal.fire({
                    title: "Deleted!",
                    text: "Your tweet has been deleted.",
                    icon: "success"
                });
            }
        });
    });

    //lOGIN
    $('#btnLogin').click(function () {
        var LoginObj = {
            UserName: $('#txtUserName').val(),
            UserPassword: $('#txtPassword').val()
        };

        Swal.fire({
            title: "Logging in...",
            html: "Please wait, this will close automatically once done.",
            timerProgressBar: true,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        $.ajax({
            url: '/api/LoginApi/CheckUser',
            type: 'POST',
            data: JSON.stringify(LoginObj),
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            success: function (res) {
                Swal.close();
                $('#spnErrorMsg').html("");

                if (res.IsVerified == 2) {
                    UserId = res.UserId;

                    window.location.href = "/SignUp/NewUserVerification?id=" + UserId;
                } else if (res.IsVerified == 3) {
                    $('#spnErrorMsg').html("Incorrect username or password");
                } else if (res.IsVerified == 1) {
                    Swal.fire({
                        title: "Login successful",
                        icon: "success",
                        showConfirmButton: false,
                        timer: 1500
                    }).then(() => {
                        var id = res.UserId;
                        clearLoginForm();
                        window.location.href = "/Homepage/GetUser?id=" + id;
                    });
                }
            },
            error: function (error) {
                Swal.close();
                $('#spnErrorMsg').html("Unable to process your request. Please try again later.");
            }
        });
    });


    //GET PROFILE
    $('#navBtnUserProfile').click(function (e) {

        localStorage.clear();
        e.preventDefault();
        window.location.href = '/Profile/UserProfile';
        getUserProfileData();
    });

    function getUserProfileData() {

        var userId = 0;
        userId = parseInt(localStorage.getItem('otherUserProfileId'));

        $('#divUserProfile').ready(function () {

            $.ajax({
                url: '/Profile/GetProfileData',
                type: 'GET',
                data: { userId: userId },
                success: function (response) {


                    if (isNaN(userId)) {

                        $('#btnEditProfile').show();
                        $('#btnUserFriendReq').show();
                    }
                    else {
                        $('#btnEditProfile').hide();
                        $('#btnUserFriendReq').hide();
                    }

                    //$('#NavBarName').html(response.FirstName);
                    //$('#NavBarNameProfile').attr("src", response.ProfilePic);

                    $('#userName').html(response.FirstName);
                    $('#profileTitle').html(response.UserName);
                    $('#uniqueUserName').html("@" + response.UserName);
                    $('#UserBioTxt').html(response.Bio);
                    $('#imgUserProfilePic').attr("src", response.ProfilePic);
                    $('#imgUserProfileBgPic').attr("src", response.ProfileBgPic);

                    if (response.CreatedAt) {
                        var milliseconds = parseInt(response.CreatedAt.replace("/Date(", "").replace(")/", ""));
                        var dateObject = new Date(milliseconds);
                        var formattedDate = dateObject.toLocaleString('en-us', { month: 'long' }) + ' ' + dateObject.getFullYear();
                        $('#JoinedDt').html("Joined " + formattedDate);
                    } else {
                        $('#JoinedDt').html("Date not available");
                    }
                    $.ajax({
                        url: '/Homepage/GetUserTweets',
                        type: 'GET',
                        data: { userId: userId },
                        success: function (response) {

                            var loggedInUserId = response.loggedInUserId.userId;
                            var tweets = response.Tweets;

                            tweets.forEach(function (tweet) {
                                appendTweetToPage(tweet, loggedInUserId, 'divUserProfileTweet');
                                //tweet.Comments.forEach(function (comment) {
                                //    prependComment(comment, tweet.TweetId, tweet);
                                //    if (comment.Replies && comment.Replies.length > 0) {
                                //        comment.Replies.forEach(function (reply) {
                                //            prependReply(reply, comment.CommentId, tweet.TweetId, tweet);
                                //        });
                                //    }
                                //});
                            });

                        },
                        error: function () {
                            // Handle error
                        }
                    });

                },
                error: function (xhr, status, error) {
                    console.error("AJAX Error:", error);
                }
            });
        });

    }

    //GET EDIT PROFILE DATA
    $('#btnEditProfile').click(function (e) {

        e.preventDefault();
        window.location.href = '/Profile/EditProfile';
    });
    $('#divEditProfile').ready(function () {
        $.ajax({
            url: '/Profile/GetProfileData',
            type: 'GET',
            beforeSend: function () {
                showLoader();
            },
            success: function (response) {

                $('#txtName').val(response.FirstName);

                if (response.DateOfBirth != null) {
                    var milliseconds = parseInt(response.DateOfBirth.replace("/Date(", "").replace(")/", ""));
                    var date = moment(milliseconds).format("YYYY-MM-DD");
                    $("#dobPicker").val(date);
                }


                $("input[name='gender']").each(function () {
                    if (this.value == response.Gender) {
                        this.checked = true;
                    } else {
                        this.checked = false;
                    }
                });

                $('#txtUserName').val(response.UserName);
                $('#txtEmail').val(response.UserEmail);
                $('#txtBio').val(response.Bio);
                $('#imgEditUserProfilePic').attr("src", response.ProfilePic);
                $('#imgEditUserProfileBgPic').attr("src", response.ProfileBgPic);
                $('#txtProfilePicPath').val(response.ProfilePic);
                $('#txtProfileBgPicPath').val(response.ProfileBgPic);

                var countries = ["United States", "Canada", "United Kingdom", "Australia", "Germany", "France", "India", "Japan", "Brazil"];

                var $selectCountry = $("#selectCountry");

                countries.forEach(function (country) {
                    $selectCountry.append($('<option>', {
                        value: country,
                        text: country
                    }));
                });
                $('#selectCountry').val(response.Country);
            },
            complete: function () {
                hideLoader();
            },
            error: function (xhr, status, error) {
                console.error("AJAX Error:", error);
            }

        });
    });

    //NEW TWEET
    $('#btnUserTweet').click(function () {

        if ($('#txtTweetText').val().trim() == '') {

            $('#spnTweetText').html("Tweet can't be empty");
            $('#txtTweetText').val('');
        }
        else {
            $('#spnTweetText').html("");
            var formData = new FormData();
            var ImageUpload = $('#fileUploadTweetImg').get(0).files[0];
            formData.append('TweetImg', ImageUpload);
            formData.append('TweetText', $('#txtTweetText').val());
            $.ajax({
                url: "/Profile/UserTweet",
                method: "POST",
                contentType: false,
                processData: false,
                data: formData,
                success: function (response) {

                    window.location.href = "/Homepage/Index";
                },
                error: function (data) {
                    // Handle error
                }
            });
        }
    });

    //LOGOUT
    $('#logoutButton').click(function (e) {

        $.ajax({
            url: '/Login/Logout',
            type: 'POST',
            success: function (response) {

                window.location.href = "/Login/Index";
            },
            error: function (xhr, status, error) {

            }
        });
    });

    // GET ALL USER LIST
    $('#navBtnAllUsers').click(function (e) {

        e.preventDefault();

        window.location.href = "/Homepage/AllUsers";
    });
    $('#divAllFriends').ready(function () {

        $.ajax({

            url: '/Homepage/getAllUsers',
            type: 'GET',
            beforeSend: function () {
                showLoader();
            },
            success: function (response) {

                response.forEach(function (user) {
                    appendUserList(user);

                });

            },
            complete: function () {
                hideLoader();
            },
            error: function (err) {

            }
        });
    });

    // APPEND ALL USER TO FRIEND LIST
    function appendUserList(user) {

        let followButtonText = (currentUser === user.SenderId && user.FollowStatus === 'pending') ? 'Cancel request' : 'Follow';
        let buttonClass = (currentUser === user.SenderId && user.FollowStatus === 'pending') ? 'btn-cancel-request' : 'btn-follow';

        let appendUserHtml = `
            <div class="flex items-center justify-between w-full gap-4 px-3 py-4 xlsm:px-5 hover:bg-gray-7 dark:hover:bg-black-6" id="divSingleUser">
                <div class="flex items-center gap-4 transition rounded-full w-fit group-hover:scale-110 group-hover:bg-gray-3 dark:group-hover:bg-gray-13 group-focus-within:bg-gray-3 dark:group-focus-within:bg-gray-13 group-focus-within:scale-110 get-other-user-profile" data-user-id="${user.UserId}">
                    <figure class="w-11">
                        <img class="w-full h-full rounded-full" src="${user.ProfilePic}" alt="Profile photo">
                    </figure>
                    <div>
                        <section class="grid items-center grid-flow-col gap-2 auto-cols-min">
                            <h2 class="overflow-hidden text-xl font-semibold dark:text-white-0 text-ellipsis whitespace-nowrap">
                                ${user.FirstName}
                            </h2>
                          
                        </section>
                        <article class="grid items-center grid-flow-col gap-2">
                            <h3 class="overflow-hidden font-semibold text-md dark:font-normal text-gray-2 text-ellipsis whitespace-nowrap">
                                @${user.UserName}
                            </h3>
                        </article>
                    </div>
                </div>
                <button class="btnUserFollow px-3 py-2 text-sm font-semibold text-center transition scale-90 rounded-full cursor-pointer xlsm:scale-100 text-white-0 ${buttonClass}" data-allUser-id="${user.UserId}">
                    ${followButtonText}
                </button>
            </div>`;
        $('#divAllFriends').prepend(appendUserHtml);
    }

    // SEE FRIEND PROFILES
    $(document).on('click', '.get-other-user-profile', function () {

        var otherUserProfileId = $(this).data('user-id');
        localStorage.setItem('otherUserProfileId', otherUserProfileId);
        window.location.href = '/Profile/UserProfile';
        getUserProfileData();
    });

    // Event delegation for dynamically added elements
    $(document).on('click', '.btnUserFollow', function () {

        var followButton = $(this);
        var userId = followButton.attr('data-allUser-id');
        var currentText = followButton.text().trim();
        console.log(currentText);
        $.ajax({
            url: '/Homepage/FollowUser',
            type: 'POST',
            data: { ReceiverId: userId },
            success: function (response) {
                if (currentText === 'Follow') {
                    Swal.fire({
                        position: "center",
                        icon: "success",
                        title: "Request send",
                        showConfirmButton: false,
                        timer: 1500
                    });
                    followButton.text('Cancel request').removeClass('btn-follow').addClass('btn-cancel-request').css('background-color', 'red');
                } else {
                    Swal.fire({
                        position: "center",
                        icon: "warning",
                        title: "Request cancelled",
                        showConfirmButton: false,
                        timer: 1500
                    });
                    followButton.text('Follow').removeClass('btn-cancel-request').addClass('btn-follow').css('background-color', '#007bff');
                }
            },
            error: function (err) {
                console.error('Error following user:', err);
            }
        });
    });

    // GET THE USER FRIEND REQUESTS
    $('#btnUserFriendReq').click(function (e) {

        e.preventDefault();
        window.location.href = "/Profile/UserFriendReq";
    });
    $('#divFriendRequest').ready(function () {

        $.ajax({

            url: '/Profile/GetUserFriendReq',
            type: 'GET',
            success: function (response) {
                if (response == '') {

                    $('#divFriendRequest').append('<div class="text-center mt-20 pt-20 dark:text-white dark:bg-black-0">No friend requests found!</div>');
                }
                else {
                    response.forEach(function (friend) {

                        appendUserFriendReq(friend);
                    });
                }

            },
            error: function (err) {

            }
        });
    });

    // APPENDING THE FREIND REQUESTS TO THE USER FRIENDS
    function appendUserFriendReq(friend) {
        const pendingReqFriendReqListHtml = `
        <div class="border-b cursor-pointer border-gray-9 dark:bg-black-0 dark:border-black-5">
            <!-- PERSON -->
            <div class="flex items-center justify-between w-full gap-4 px-3 py-4 xlsm:px-5 hover:bg-gray-7 dark:hover:bg-black-6">
                <div class="flex items-center gap-4 transition rounded-full w-fit group-hover:scale-110 group-hover:bg-gray-3 dark:group-hover:bg-gray-13 group-focus-within:bg-gray-3 dark:group-focus-within:bg-gray-13 group-focus-within:scale-110">
                    <figure class="w-11">
                        <img class="w-full h-full rounded-full" src="${friend.ProfilePic}" alt="Profile photo">
                    </figure>
                    <div>
                        <section class="grid items-center grid-flow-col gap-2 auto-cols-min">
                            <h2 class="overflow-hidden text-xl font-semibold dark:text-white-0 text-ellipsis whitespace-nowrap">
                                ${friend.FirstName}
                            </h2>
                        </section>
                        <article class="grid items-center grid-flow-col gap-2">
                            <h3 class="overflow-hidden font-semibold text-md dark:font-normal text-gray-2 text-ellipsis whitespace-nowrap">
                                @${friend.UserName}
                            </h3>
                        </article>
                    </div>
                </div>
                <button class="btnFriendReqAccept px-3 py-2 ml-auto text-sm font-semibold text-center transition scale-90 rounded-full cursor-pointer xlsm:scale-100 text-white-0 bg-primary hover:scale-110" data-req-sender-id="${friend.SenderId}">
                    Accept
                </button>
                <button class="btnFriendReqReject px-3 py-2 text-sm font-semibold text-center transition scale-90 rounded-full cursor-pointer xlsm:scale-100 text-white-0 bg-red-500 hover:scale-110" data-req-sender-id="${friend.SenderId}">
                    Reject
                </button>
            </div>
        </div>
    `;

        $('#divFriendRequest').append(pendingReqFriendReqListHtml);
    }

    // ACCEPT BUTTON CLICK
    $(document).on('click', '.btnFriendReqAccept', function () {
        const senderId = $(this).data('req-sender-id');
        handleFriendRequest(senderId, 'accept', $(this));
    });

    // REJECT BUTTON CLICK
    $(document).on('click', '.btnFriendReqReject', function () {
        const senderId = $(this).data('req-sender-id');
        handleFriendRequest(senderId, 'reject', $(this));
    });

    // PERFORM APPROPRIATE ACTION ACCORDING TO BUTTON
    function handleFriendRequest(senderId, action, buttonElement) {

        if (action == 'accept') {


            $.ajax({
                url: '/Profile/AcceptFriendReq',
                type: 'POST',
                data: {
                    SenderId: senderId
                },
                success: function (response) {
                    Swal.fire({
                        position: "center",
                        icon: "success",
                        title: "Request accepted.",
                        showConfirmButton: false,
                        timer: 1500
                    });
                    buttonElement.closest('.border-b').remove();
                },
                error: function (error) {

                }
            });
        }
        else {

            Swal.fire({
                title: "Are you sure? You want to reject friend request.",
                text: "You won't be able to revert this!",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Yes, reject it!"
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: "Deleted!",
                        text: "Your file has been deleted.",
                        icon: "success"
                    });
                    $.ajax({
                        url: '/Profile/RejectFriendReq',
                        type: 'POST',
                        data: {
                            SenderId: senderId
                        },
                        success: function (response) {
                            buttonElement.closest('.border-b').remove();
                        },
                        error: function (error) {

                        }
                    });
                }
            });


        }
    }

    // GET THE USER FRIENDS
    $('#btnUserFriend').click(function (e) {

        //e.preventDefault();
        window.location.href = "/Profile/UserFriend";
        userFriends();
    });

    function userFriends() {

        $('#divFriend').ready(function () {

            var userId = 0;
            userId = parseInt(localStorage.getItem('otherUserProfileId'));

            $.ajax({

                url: '/Profile/GetUserFriend',
                type: 'GET',
                data: { userId: userId },
                success: function (response) {
                    if (response == '') {

                        $('#divFriend').append('<div class="text-center mt-20 pt-20 dark:text-white dark:bg-black-0">No friends found!</div>');
                    }
                    else {
                        response.forEach(function (friend) {

                            appendUserFriend(friend);
                        });
                    }

                },
                error: function (err) {

                }
            });
        });
    }

    // APPENDING THE FREIND TO THE USER FRIENDS
    function appendUserFriend(friend) {

        userId = parseInt(localStorage.getItem('otherUserProfileId'));


        if (!userId) {
            $('.div-see-friend-req').show();
            BtnRemoveFriendHtml = ` <button class="btnFriendRemove px-3 py-2 ml-auto text-sm font-semibold text-center transition scale-90 rounded-full cursor-pointer xlsm:scale-100 text-white-0 bg-red-500 hover:scale-110" data-req-sender-id="${friend.SenderId}" data-req-receiver-id="${friend.ReceiverId}">
                                        Remove
                                    </button>`;
        }
        else {
            $('.div-see-friend-req').hide();
            var BtnRemoveFriendHtml = ``;
        }

        const FriendListHtml = `
        <div class="border-b cursor-pointer border-gray-9 dark:bg-black-0 dark:border-black-5">
            <!-- PERSON -->
            <div class="flex items-center justify-between w-full gap-4 px-3 py-4 xlsm:px-5 hover:bg-gray-7 dark:hover:bg-black-6">
                <div class="flex items-center gap-4 transition rounded-full w-fit group-hover:scale-110 group-hover:bg-gray-3 dark:group-hover:bg-gray-13 group-focus-within:bg-gray-3 dark:group-focus-within:bg-gray-13 group-focus-within:scale-110  get-other-user-profile" data-user-id="${friend.UserId}">
                    <figure class="w-11">
                        <img class="w-full h-full rounded-full" src="${friend.ProfilePic}" alt="Profile photo">
                    </figure>
                    <div>
                        <section class="grid items-center grid-flow-col gap-2 auto-cols-min">
                            <h2 class="overflow-hidden text-xl font-semibold dark:text-white-0 text-ellipsis whitespace-nowrap">
                                ${friend.FirstName}
                            </h2>
                        </section>
                        <article class="grid items-center grid-flow-col gap-2">
                            <h3 class="overflow-hidden font-semibold text-md dark:font-normal text-gray-2 text-ellipsis whitespace-nowrap">
                                @${friend.UserName}
                            </h3>
                        </article>
                    </div>
                </div>
               ${BtnRemoveFriendHtml}
            </div>
        </div>
    `;


        $('#divFriend').append(FriendListHtml);
    }

    // REMOVE FRIEND FROM THE LIST
    $(document).on('click', '.btnFriendRemove', function () {


        const senderId = $(this).data('req-sender-id');
        const receiverId = $(this).data('req-receiver-id');
        var divFriendElement = $(this);


        Swal.fire({
            title: "Are you sure? You want to remove friend.",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, remove friend!"
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: "Removed!",
                    text: "Friend removed successfully",
                    icon: "success"
                });
                $.ajax({
                    url: '/Profile/RemoveFriend',
                    type: 'POST',
                    data: {
                        senderId: senderId,
                        receiverId: receiverId,
                    },
                    success: function (response) {
                        divFriendElement.closest('.border-b').remove();
                    },
                    error: function (error) {

                    }
                });
            }
        });


    });

    // NOTIFICATION
    $('#navBtnNotification').click(function (e) {

        e.preventDefault();
        window.location.href = "/Homepage/Notification";
    });

    // GET ALL NOTIFICATION
    $('#divMainContent').ready(function () {
        $.ajax({
            url: '/Homepage/GetAllNotification',
            type: 'GET',
            success: function (response) {

                response.reverse().forEach(function (notification) {

                    if (notification.NotificationText === 'liked your tweet') {
                        appendLikeNotification(notification);
                    } else if (notification.NotificationText === 'Commented on your tweet') {
                        appendCommentNotification(notification);
                    } else if (notification.NotificationText === 'Send you friend request' || notification.NotificationReqStatus === 'accepted' || notification.NotificationReqStatus === 'rejected') {
                        appendFollowNotification(notification);
                    }

                });
            },
            error: function (error) {
                console.log(error);
            }
        });


        // Function to append follow notifications
        function appendFollowNotification(notification) {
            var notificationTime = formatTweetDate(notification.NotificationTime);

            if (currentUser == notification.NotificationReceiverId && notification.NotificationReqStatus == 'pending') {
                const followNotificationHTML = `
        <div class="flex gap-2 px-3 py-4 border-b cursor-pointer sm:px-6 sm:gap-5 dark:hover:bg-black-6 border-gray-9 dark:border-black-5 hover:bg-gray-7">
            <!-- EMOJI IDENTIFIER -->
            <figure class="flex items-start justify-end pl-4">
                <svg viewBox="0 0 24 24" aria-hidden="true" class="w-8 fill-primary">
                    <g>
                        <path d="M17.863 13.44c1.477 1.58 2.366 3.8 2.632 6.46l.11 1.1H3.395l.11-1.1c.266-2.66 1.155-4.88 2.632-6.46C7.627 11.85 9.648 11 12 11s4.373.85 5.863 2.44zM12 2C9.791 2 8 3.79 8 6s1.791 4 4 4 4-1.79 4-4-1.791-4-4-4z"></path>
                    </g>
                </svg>
            </figure>

            <!-- CONTENT -->
            <article class="flex flex-col gap-3">
                <!-- USER LOGOS -->
                <div class="flex gap-2">
                    <figure class="w-8 duration-200 rounded-full hover:opacity-80 hover:bg-black-1">
                        <img class="object-contain w-full h-full rounded-full"
                             src="${notification.NotifierProfilePic}" alt="User profile photo">
                    </figure>
                    ${notificationTime}
                </div>

                <!-- USERNAMES - it has display flex because we have to mix up anchor and svg tags -->
                <h2 class="flex flex-wrap items-center gap-1 text-sm dark:text-gray-3">
                    <a class="flex items-center gap-1 overflow-hidden font-bold hover:underline decoration-1 text-ellipsis whitespace-nowrap"
                       href="#">
                        ${notification.NotifierFirstName}
                    </a>
                    ${notification.NotificationText}
                </h2>
            </article>
        </div>`;
                $('#divAllNotification').prepend(followNotificationHTML);
            }

            if (currentUser == notification.NotifierUserId && (notification.NotificationReqStatus == 'accepted' || notification.NotificationReqStatus == 'rejected')) {

                let messageText = '';
                if (notification.NotificationReqStatus === 'accepted') {
                    messageText = 'accepted your friend request';
                } else {
                    messageText = 'rejected your friend request';
                }

                const followNotificationHTML = `
        <div class="flex gap-2 px-3 py-4 border-b cursor-pointer sm:px-6 sm:gap-5 dark:hover:bg-black-6 border-gray-9 dark:border-black-5 hover:bg-gray-7">
            <!-- EMOJI IDENTIFIER -->
            <figure class="flex items-start justify-end pl-4">
                <svg viewBox="0 0 24 24" aria-hidden="true" class="w-8 fill-primary">
                    <g>
                        <path d="M17.863 13.44c1.477 1.58 2.366 3.8 2.632 6.46l.11 1.1H3.395l.11-1.1c.266-2.66 1.155-4.88 2.632-6.46C7.627 11.85 9.648 11 12 11s4.373.85 5.863 2.44zM12 2C9.791 2 8 3.79 8 6s1.791 4 4 4 4-1.79 4-4-1.791-4-4-4z"></path>
                    </g>
                </svg>
            </figure>

            <!-- CONTENT -->
            <article class="flex flex-col gap-3">
                <!-- USER LOGOS -->
                <div class="flex gap-2">
                    <figure class="w-8 duration-200 rounded-full hover:opacity-80 hover:bg-black-1">
                        <img class="object-contain w-full h-full rounded-full"
                             src="${notification.ReceiverProfilePic}" alt="User profile photo">
                    </figure>
                    ${notificationTime}
                </div>

                <!-- USERNAMES - it has display flex because we have to mix up anchor and svg tags -->
                <h2 class="flex flex-wrap items-center gap-1 text-sm dark:text-gray-3">
                    <a class="flex items-center gap-1 overflow-hidden font-bold hover:underline decoration-1 text-ellipsis whitespace-nowrap"
                       href="#">
                        ${notification.ReceiverFirstName}
                    </a>
                    ${messageText}
                </h2>
            </article>
        </div>`;
                $('#divAllNotification').prepend(followNotificationHTML);
            }

        }

        // LIKE NOTIFICATION HTML
        function appendLikeNotification(notification) {

            var notificationTime = formatTweetDate(notification.NotificationTime);
            var notificationTweetImgHtml = appendUserTweetImageOnNotification(notification);
            var NotificationHtml = '';
            if (currentUser == notification.TweetOwnerId || notification.text == 'liked your tweet') {


                NotificationHtml = `
        <div class="flex gap-2 px-3 py-4 border-b cursor-pointer sm:px-6 sm:gap-5 dark:hover:bg-black-6 border-gray-9 dark:border-black-5 hover:bg-gray-7">
            <!-- EMOJI IDENTIFIER -->
            <figure class="flex items-start justify-end pl-4">
                <svg viewBox="0 0 24 24" aria-hidden="true" class="w-8 fill-red-0">
                    <g>
                        <path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path>
                    </g>
                </svg>
            </figure>
            <!-- CONTENT -->
            <article class="flex flex-col gap-3">
                <!-- USER LOGOS -->
                <div class="flex gap-2">
                    <figure class="w-8 duration-200 rounded-full hover:opacity-80 hover:bg-black-1">
                        <img class="object-contain w-full h-full rounded-full" src="${notification.NotifierProfilePic}" alt="User profile photo">
                    </figure>
                    ${notificationTime}
                </div>
                <!-- USERNAMES -->
                <h2 class="flex flex-wrap items-center gap-1 text-sm dark:text-gray-3">
                    <a href="#" class="flex items-center gap-1 overflow-hidden font-bold hover:underline decoration-1 text-ellipsis whitespace-nowrap">
                        ${notification.NotifierFirstName}
                        <svg viewBox="0 0 24 24" class="w-4 fill-black-1 dark:fill-gray-3">
                            <g>
                                <path d="M17.5 7H17v-.25c0-2.76-2.24-5-5-5s-5 2.24-5 5V7h-.5C5.12 7 4 8.12 4 9.5v9C4 19.88 5.12 21 6.5 21h11c1.39 0 2.5-1.12 2.5-2.5v-9C20 8.12 18.89 7 17.5 7zM13 14.73V17h-2v-2.27c-.59-.34-1-.99-1-1.73 0-1.1.9-2 2-2 1.11 0 2 .9 2 2 0 .74-.4 1.39-1 1.73zM15 7H9v-.25c0-1.66 1.35-3 3-3 1.66 0 3 1.34 3 3V7z"></path>
                            </g>
                        </svg>
                    </a>
                    ${notification.NotificationText}
                    
                </h2>
                
                <!-- TWEET -->
                <section>
                    <h4 class="text-sm font-normal dark:text-gray-5 dark:font-semibold text-gray-4">
                        ${notification.TweetText}
                        ${notificationTweetImgHtml}
                    </h4>
                </section>
               
            </article>
        </div>
    `;
            }
            $('#divAllNotification').prepend(NotificationHtml);
        }

        //APPEND IMAGE TO THE NOTIFICATION
        function appendUserTweetImageOnNotification(notification) {

            if (notification.TweetImage !== null && notification.TweetImage !== '') {
                return `
            <div class="max-h-[100px] max-w-[100px] border bg-gray-4 dark:bg-twitter-dark-gray border-gray-4 rounded-xl overflow-hidden">
                <figure>
                    <img role="button" class="object-cover w-full h-full" src="${notification.TweetImage}" />
                </figure>
            </div>`;
            }
            else {
                return ``;
            }
        }

        // COMMENT NOTIFICATION HTML
        function appendCommentNotification(notification) {

            var notificationTime = formatTweetDate(notification.NotificationTime);
            var notificationTweetImgHtml = appendUserTweetImageOnNotification(notification);

            if (currentUser == notification.TweetOwnerId || notification.text == 'Commented on your tweet') {
                var commentNotificationHtml = `
                <div class="flex gap-2 px-3 py-4 border-b cursor-pointer sm:px-6 sm:gap-5 dark:hover:bg-black-6 border-gray-9 dark:border-black-5 hover:bg-gray-7">
                    <!-- EMOJI IDENTIFIER -->
                        <figure class="flex items-start justify-end pl-4">
                            <svg viewBox="0 0 24 24" aria-hidden="true" class="w-8 fill-violet-0">
                                <g>
                                   <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </g>
                            </svg>
                        </figure>
                    <!-- CONTENT -->
                    <article class="flex flex-col gap-3">
                        <!-- USER LOGOS -->
                        <div class="flex gap-2">
                            <figure class="w-8 duration-200 rounded-full hover:opacity-80 hover:bg-black-1">
                                <img class="object-contain w-full h-full rounded-full" src="${notification.NotifierProfilePic}" alt="User profile photo">
                            </figure>
                            ${notificationTime}
                        </div>
               
                        <!-- USERNAMES -->
                        <h2 class="flex flex-wrap items-center gap-1 text-sm dark:text-gray-3">
                            <a href="#" class="flex items-center gap-1 overflow-hidden font-bold hover:underline decoration-1 text-ellipsis whitespace-nowrap">
                                ${notification.NotifierFirstName}
                                <svg viewBox="0 0 24 24" class="w-4 fill-black-1 dark:fill-gray-3">
                                    <g>
                                        <path d="M17.5 7H17v-.25c0-2.76-2.24-5-5-5s-5 2.24-5 5V7h-.5C5.12 7 4 8.12 4 9.5v9C4 19.88 5.12 21 6.5 21h11c1.39 0 2.5-1.12 2.5-2.5v-9C20 8.12 18.89 7 17.5 7zM13 14.73V17h-2v-2.27c-.59-.34-1-.99-1-1.73 0-1.1.9-2 2-2 1.11 0 2 .9 2 2 0 .74-.4 1.39-1 1.73zM15 7H9v-.25c0-1.66 1.35-3 3-3 1.66 0 3 1.34 3 3V7z"></path>
                                    </g>
                                </svg>
                            </a>
                   
                            ${notification.NotificationText}
                        </h2>
                        <!-- TWEET -->
                        <section>
                            <h4 class="text-sm font-normal dark:text-gray-5 dark:font-semibold text-gray-4">
                                ${notification.TweetText}
                                ${notificationTweetImgHtml}
                            </h4>
                        </section>
                    </article>
                </div>`;
            }
            $('#divAllNotification').prepend(commentNotificationHtml);
        }
    });

    // SEARCH HASHTAG
    $('#divMainContentBody').ready(function () {
        $(document).on('keyup', '#searchBar', function () {
            var searchText = $('#searchBar').val().trim();

            $.ajax({
                url: '/Homepage/SearchHashtag',
                type: 'GET',
                data: { searchText: searchText },
                success: function (response) {

                    $('#divUserTweet').empty();

                    if (response && response.Tweets && Array.isArray(response.Tweets)) {

                        var hashtag = [];
                        response.Tweets.forEach(function (tweet) {
                            //console.log(tweet);
                            var SplitWords = tweet.TweetText.split(' ');
                            SplitWords.forEach(function (words) {
                                if (words.startsWith('#') && words.length > 1) {
                                    hashtag.push(words);
                                }
                            });

                        });

                        $('#suggestions').empty();

                        hashtag.forEach(function (hashtag) {

                            if (searchText.length != 0) {
                                var suggestionItem = $('<div>')
                                    .addClass('suggestion-item p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer')
                                    .text(hashtag)
                                    .on('click', function () {
                                        $('#searchBar').val(hashtag);
                                        $('#suggestions').empty();

                                        $('#searchBar').trigger('keyup');
                                    });
                                $('#suggestions').prepend(suggestionItem);
                            }
                        });


                        response.Tweets.forEach(function (tweet) {
                            appendTweetToPage(tweet, currentUser, 'divUserTweet');
                        });
                    } else {
                        console.error("Invalid response format");
                    }
                },
                error: function (error) {
                    // Handle error
                    console.error("Error fetching tweets:", error);
                }
            });
        });
    });

    // Function to fetch the top hashtags and display them
    function topHashtag() {
        $.ajax({
            url: '/Homepage/TopHashtag',
            type: 'GET',
            success: function (response) {
                var hashtagCounts = {};
                var hashtagDates = {};
                var topHashtagArray = [];

                // Filter hashtags from the response and store their dates
                response.forEach(function (tweet) {
                    var totalWords = tweet.TweetText.split(' ');
                    var date = new Date(parseInt(tweet.TweetPostedTime.substr(6)));
                    totalWords.forEach(function (word) {
                        if (word.startsWith("#")) {
                            topHashtagArray.push({ hashtag: word, date: date });
                        }
                    });
                });

                // Count occurrences of each hashtag and keep track of the most recent date
                topHashtagArray.forEach(function (item) {
                    var hashtag = item.hashtag;
                    var date = item.date;
                    if (hashtagCounts[hashtag]) {
                        hashtagCounts[hashtag]++;
                        if (date > hashtagDates[hashtag]) {
                            hashtagDates[hashtag] = date;
                        }
                    } else {
                        hashtagCounts[hashtag] = 1;
                        hashtagDates[hashtag] = date;
                    }
                });

                // Prepare the result in the desired format
                var totalTweetByHashtag = [];
                for (var hashtag in hashtagCounts) {
                    totalTweetByHashtag.push({
                        HashtagName: hashtag,
                        TweetCount: hashtagCounts[hashtag],
                        LastUsedDate: hashtagDates[hashtag]
                    });
                }

                // Sort the array first by TweetCount in descending order, then by LastUsedDate in descending order
                totalTweetByHashtag.sort(function (a, b) {
                    if (b.TweetCount !== a.TweetCount) {
                        return b.TweetCount - a.TweetCount;
                    } else {
                        return b.LastUsedDate - a.LastUsedDate;
                    }
                });

                // Append the top 5 hashtags to the DOM
                var appendCount = 0;
                totalTweetByHashtag.forEach(function (hashtag) {
                    if (appendCount < 5) {
                        appendTopHashtag(hashtag);
                        appendCount++;
                    }
                });
            },
            error: function (error) {
                console.error('Error:', error);
            }
        });
    }

    // TOP HASHTAG HTML
    function appendTopHashtag(hashtag) {

        HashtagHtml = `<a class="relative flex flex-col gap-1 px-8 py-3 cursor-pointer hover:bg-gray-3 dark:hover:bg-black-3" data-hashtag-name="${hashtag.HashtagName}" id="topHashtag">

                    <h3 class="font-bold dark:text-gray-3">${hashtag.HashtagName}</h3>
                    <h5 class="text-sm font-medium dark:font-semibold text-gray-5">${hashtag.TweetCount} Tweets</h5>
                </a>`;


        $('#divTopHashtag').append(HashtagHtml);
    }

    //FILTER TWEET BY CLICKING ON THE TOP 5 HASH TAGS
    $(document).on('click', '#topHashtag', function (e) {

        HomepageUrl = 'https://localhost:44364/Homepage';

        const hashtagName = $(this).data('hashtag-name');
        const url = getCurrentURL();
        if (url != HomepageUrl) {

            e.preventDefault();
            window.location.href = '/Homepage';
            localStorage.setItem('hashtagName', hashtagName);
        }
        appendTweetByHashtag(hashtagName);

    });

    //APPEND HASH TAG TWEET BY HASHTAG NAME FUNCTION
    function appendTweetByHashtag(hashtagName) {
        $(document).ready(function () {
            $.ajax({

                url: '/Homepage/GetTweetByHashtagName',
                type: 'GET',
                data: { hashtagName: hashtagName },
                success: function (response) {


                    $('#divUserTweet').empty();
                    console.log(response);
                    if (response && response.Tweets && Array.isArray(response.Tweets)) {

                        response.Tweets.forEach(function (tweet) {
                            appendTweetToPage(tweet, currentUser, 'divUserTweet');
                        });
                    } else {
                        console.error("Invalid response format");
                    }

                },
                error: function (err) {

                }
            });
        });
    }

    // BUTTON SHOW ALL TWEETS
    $(document).on('click', '#showAllHashtag', function () {
        $('#divUserTweet').empty();
        getAllTweets();
    });

    // REMOVE THE BANNER IMAGE
    $('#delete-banner').on('click', function (event) {
        event.preventDefault();
        $('#imgEditUserProfileBgPic').attr('src', '/Images/DefaultProfileBg.png');

        $('#txtProfileBgPicPath').val('/Images/DefaultProfileBg.png');
    });

    // REMOVE THE PROFILE IMAGE
    $('#delete-profile-pic').on('click', function (event) {
        event.preventDefault();

        // Remove the profile picture by setting its src attribute to the default image path
        $('#imgEditUserProfilePic').attr('src', '/Images/DefaultProfile.png');

        // Set the file upload path to the default image
        $('#txtProfilePicPath').val('/Images/DefaultProfile.png');
    });

    // SEND RESET PASSWORD LINK TO THE MAIL
    $('#btnSendMail').click(function (e) {
        e.preventDefault();

        var success = 1;
        const emailPattern = /[a-zA-Z0-9_\-\.]+@[a-z]+\.[a-z]{2,3}/;
        var email = $('#txtForgotPasswordEmail').val().trim();

        if (email === '') {
            $('#divForegetPassErrorMessage').text("Email can't be empty!");
            success = 0;
        } else if (!email.match(emailPattern)) {
            $('#divForegetPassErrorMessage').text("Enter valid email");
            success = 0;
        } else {
            $('#divForegetPassErrorMessage').text("");
            success = 1;
        }

        if (success == 1) {

            Swal.fire({
                title: "Sending Reset Password Link...",
                html: "Please wait, we are sending you reset password link to you mail.",
                timerProgressBar: true,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // AJAX call to send reset password link
            $.ajax({
                url: '/Login/EmailForForgotPassword',
                type: 'POST',
                data: { email: email },
                success: function (response) {

                    Swal.close();
                    $('#divForegetPassErrorMessage').text("");
                    if (response === 0) {
                        $('#divForegetPassErrorMessage').text("Email not found");
                    } else {
                        Swal.fire({
                            position: "center",
                            icon: "success",
                            title: "Reset password link sent to your email.",
                            showConfirmButton: false,
                            timer: 2000
                        });
                        window.Location.href = '/Login/Index';
                    }
                },
                error: function (error) {

                    Swal.close();
                    $('#divForegetPassErrorMessage').text("Unable to process your request. Please try again later.");
                }
            });
        }
    });

    // VALIDATE RESET PASSWORD TOKEN
    $('#divResetPassword').ready(function () {

        $('#divResetPassword').hide();
        $('#divInvalidToken').hide();

        const searchParams = new URLSearchParams(window.location.search);
        var token = searchParams.get('token');

        if (token != undefined) {

            var finalToken = token.replaceAll(" ", "+");


            $.ajax({
                url: '/Login/ValidateToken',
                type: 'POST',
                data: { token: finalToken },
                success: function (response) {

                    if (response === 0) {

                        $('#divInvalidToken').show();
                    }
                    else {
                        $('#divResetPassword').show();
                    }
                },
                error: function (error) {
                }
            });
        }
        else {
            $('#divInvalidToken').show();
        }

    });

    // RESET PASSWORD
    $('#btnReset').click(function (e) {
        e.preventDefault();

        var sucessResetPassword = 1;
        var newPassword = $('#txtNewPassword').val().trim();
        var repeatNewPassword = $('#txtRepeatNewPassword').val();

        // Validate Password
        if (newPassword === '' || repeatNewPassword === '') {
            $('#divResetPasswordErrorMessage').text("New password or repeat new password can't be empty");
            sucessResetPassword = 0;
        } else if (newPassword !== repeatNewPassword) {
            $('#divResetPasswordErrorMessage').text("Passwords do not match!");
            sucessResetPassword = 0;
        }
        else if (newPassword.length < 8 || newPassword.length > 12) {
            $('#divResetPasswordErrorMessage').text("Password must be 8 to 12 characters long");
            sucessResetPassword = 0;

        } else {
            $('#spn-error-msg-password').html("");
            sucessResetPassword = 1;
        }

        const searchParams = new URLSearchParams(window.location.search);
        var token = searchParams.get('token');
        var finalToken = token.replace(" ", "+");

        if (sucessResetPassword == 1) {
            $.ajax({
                url: '/Login/ResetPassword',
                type: 'POST',
                data: {
                    token: finalToken,
                    newPassword: newPassword
                },
                success: function (response) {
                    if (response.success) {
                        Swal.fire({
                            position: "center",
                            icon: "success",
                            title: "Reset password successful",
                            showConfirmButton: false,
                            timer: 1500
                        });
                        window.location.href = '/Login/Index';
                    } else {
                        $('#divResetPasswordErrorMessage').text(response.message);
                    }
                },
                error: function (error) {
                    console.error("Error:", error);
                    $('#divResetPasswordErrorMessage').text("An error occurred while resetting the password.");
                }
            });
        }
    });

    // VERFYING NEW USER
    $('#btnVerify').click(function (e) {
        e.preventDefault();
        const searchParams = new URLSearchParams(window.location.search);
        const userId = searchParams.get('id');
        const otpNumber = $('#numOtp').val().trim();
        //$('#divResendOtp').addClass('hidden').removeClass('visible');

        $('#divOtpMsg').html("");

        if (otpNumber == null || otpNumber == "") {
            $('#divOtpMsg').html("OTP can't be empty!");
            return;
        } else if (otpNumber.length < 4) {
            $('#divOtpMsg').html("OTP must be 4 digit");
            return;
        }


        Swal.fire({
            title: "Verifying OTP...",
            html: "Please wait, this will close automatically once done.",
            timerProgressBar: true,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // AJAX call to verify OTP
        $.ajax({
            url: '/api/SignUpApi/VerifyOtp',
            type: 'POST',
            data: JSON.stringify({ otpNumber: otpNumber, userId: userId }),
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            success: function (res) {

                Swal.close();
                if (res == 1) {
                    Swal.fire({
                        position: "center",
                        icon: "success",
                        title: "Signup successful",
                        showConfirmButton: false,
                        timer: 1500
                    }).then(() => {
                        window.location.href = "/Homepage/GetUser?id=" + userId;
                    });
                } else if (res == 0) {
                    $('#divOtpMsg').html("OTP is expired!");
                    //$('#divResendOtp').addClass('visible').removeClass('hidden');
                } else {
                    $('#divOtpMsg').html("Invalid OTP. Please try again.");
                }
            },
            error: function (err) {

                Swal.close();
                $('#divOtpMsg').html("Unable to process your request. Please try again later.");
            }
        });
    });

    //RESEND OTP
    $('#spnResendOtp').click(function (e) {
        e.preventDefault();
        const searchParams = new URLSearchParams(window.location.search);
        const userId = parseInt(searchParams.get('id'));

        Swal.fire({
            title: "Resending OTP...",
            html: "Please wait, we are resending OTP to your email.",
            timerProgressBar: true,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // AJAX call to resend OTP
        $.ajax({
            url: '/api/SignUpApi/ResendOtp',
            type: 'GET',
            data: { userId: userId },
            success: function (res) {

                Swal.fire({
                    position: "center",
                    icon: "success",
                    title: "OTP resend successfully, please check you email.",
                    showConfirmButton: false,
                    timer: 2000
                });
                $('#divOtpMsg').html("");
            },
            error: function (err) {

                Swal.fire({
                    position: "center",
                    icon: "error",
                    title: "Failed to resend OTP",
                    text: "Please try again later.",
                    showConfirmButton: true
                });
            }
        });
    });

    $('#linkChangePassword').click(function (e) {

        e.preventDefault();
        $("#divUserEditProfile").addClass('hidden').removeClass('visible');
        $("#divChangePassword").addClass('visible').removeClass('hidden');

    });

    
    $('#btnChgPassword').click(function (e) {

        e.preventDefault();

        var successChgPassword = 1;
        var oldPassword = $('#txtOldPasswordProfile').val().trim();
        var newPassword = $('#txtNewPasswordProfile').val().trim();
        var repeatNewPassword = $('#txtRepeatNewPasswordProfile').val().trim();

        // Validate Password
        if (newPassword === '' || repeatNewPassword === '' || oldPassword == '') {
            $('#divMsgChangePassword').text("Password can't be empty");
            successChgPassword = 0;
        } else if (newPassword !== repeatNewPassword) {
            $('#divMsgChangePassword').text("Passwords do not match!");
            successChgPassword = 0;
        }
        else if (newPassword.length < 8 || newPassword.length > 12) {
            $('#divMsgChangePassword').text("Password must be 8 to 12 characters long");
            successChgPassword = 0;

        } else {
            $('#divMsgChangePassword').html("");
            successChgPassword = 1;
        }

      
        if (successChgPassword == 1) {
            $.ajax({
                url: '/Profile/ProfileChangePassword',
                type: 'POST',
                dataType: 'json',
                data: JSON.stringify({
                    oldPassword: oldPassword,
                    newPassword: newPassword
                }),
                contentType: 'application/json; charset=utf-8',
                
                success: function (response) {
                    if (response.success) {
                        Swal.fire({
                            position: "center",
                            icon: "success",
                            title: "Change password successful",
                            showConfirmButton: false,
                            timer: 1500
                        }).then(() => {
                            window.location.href = '/Profile/EditProfile';
                        });
                    } else {
                        $('#divMsgChangePassword').text(response.message);
                    }

                    if (response == 2) {
                        $('#divMsgChangePassword').text("Incorrect old password");
                    }
                },
                error: function (error) {
                    console.error("Error:", error);
                    $('#divMsgChangePassword').text("An error occurred while resetting the password.");
                }
            });
        }

    });


}); //END OF DOCUMENT READY


function getCurrentURL() {
    return window.location.href
}

function formatTweetDate(tweetPostedTime) {
    var milliseconds = parseInt(tweetPostedTime.replace("/Date(", "").replace(")/", ""));
    var dateObject = new Date(milliseconds);
    var currentDate = new Date();
    var timeDifference = currentDate.getTime() - dateObject.getTime();
    var secondsDifference = Math.floor(timeDifference / 1000);
    var timeAgo = '';
    var unit = '';


    if (secondsDifference < 60) {
        timeAgo = 'just now';
    } else if (secondsDifference < 3600) {
        timeAgo = Math.floor(secondsDifference / 60);
        unit = 'minute';
    } else if (secondsDifference < 86400) {
        timeAgo = Math.floor(secondsDifference / 3600);
        unit = 'hour';
    } else {
        timeAgo = Math.floor(secondsDifference / 86400);
        unit = 'day';
    }

    if (timeAgo !== 'just now' && timeAgo !== 1) {
        unit += 's';
        var formattedDate = timeAgo + ' ' + unit + ' ago';
    } else {
        var formattedDate = timeAgo + ' ' + unit;
    }
    return formattedDate;
}

function clearPreview() {
    const previewContainer = $('#filePreviewContainer');
    const imgPreview = $('#imgTweetPreview');
    const videoPreview = $('#videoTweetPreview');
    const fileInput = $('#fileUploadTweetImg');
   
    fileInput.val('');

    previewContainer.addClass('hidden');
    imgPreview.addClass('hidden');
    videoPreview.addClass('hidden');

    imgPreview.attr('src', '');
    videoPreview.attr('src', '');
}

$('#fileUploadTweetImg').on('change', function (event) {
    const file = event.target.files[0];
    const previewContainer = $('#filePreviewContainer');
    const imgPreview = $('#imgTweetPreview');
    const videoPreview = $('#videoTweetPreview');

    if (file) {
        const fileURL = URL.createObjectURL(file);
        previewContainer.removeClass('hidden');

        if (file.type.startsWith('image/')) {
            imgPreview.attr('src', fileURL).removeClass('hidden');
            videoPreview.addClass('hidden');
        } else if (file.type.startsWith('video/')) {
            videoPreview.attr('src', fileURL).removeClass('hidden');
            imgPreview.addClass('hidden');
        }
    }
});

$('#deleteTweetImgVid').on('click', function (event) {
    event.preventDefault();
    clearPreview();
});


function clearLoginForm() {

    $('#txtUserName').val('');
    $('#txtPassword').val('');
    $('#txtEmail').val('');
}

// Function to show the loader
function showLoader() {
    $('#loader').show();
}

// Function to hide the loader
function hideLoader() {
    $('#loader').hide();
}


function appendTweetToPage(tweet, loggedInUserId, targetElementId) {
    var formattedDate = formatTweetDate(tweet.TweetPostedTime);
   
    var tweetImgHtml = '';
    var tweetVidHtml = '';
    if (tweet.TweetImg !== null && tweet.TweetImg !== '') {
       

        var tweetVid = tweet.TweetImg.split('.');
        if (tweetVid.includes('mp4') || tweetVid.includes('mov')) {

            tweetVidHtml =
                `<div class="max-h-[500px] border bg-gray-4 dark:bg-twitter-dark-gray border-gray-4 rounded-xl overflow-hidden">
                <figure>
                    <video class="object-cover w-full h-full" autoplay loop muted>
                         <source src="${tweet.TweetImg}" type="video/mp4">
                    </video>
                </figure>
            </div>`;
        }
        else {

            tweetImgHtml = `
            <div class="max-h-[500px] border bg-gray-4 dark:bg-twitter-dark-gray border-gray-4 rounded-xl overflow-hidden">
                <figure>
                    <img role="button" class="object-cover w-full h-full" src="${tweet.TweetImg}" />
                </figure>
            </div>`;
        }
    }

  
    
    var deleteButtonHtml = getDeleteButtonHtml(tweet.UserId, loggedInUserId, tweet.TweetId);

    var tweetHtml = `
        <div class="tweet-container border-t border-gray-500 dark:border-black-5 flex w-full gap-4 px-5 pt-3 hover:bg-gray-7 dark:hover:bg-black-6" id="tweet-${tweet.TweetId}">
            <a>
                <figure class="mt-2 rounded-full h-11 w-11 hover:bg-black-0">
                    <img src="${tweet.ProfilePic}" alt="Profile photo" class="w-full h-full rounded-full hover:opacity-80" />
                </figure>
            </a>
            <div class="flex flex-col flex-1 gap-2">
                <div class="flex flex-col gap-1">
                    <a class="grid items-center grid-flow-col gap-2 auto-cols-auto-auto-1fr">
                        <span class="overflow-hidden font-bold text-ellipsis whitespace-nowrap hover:underline dark:text-white-0">${tweet.FirstName}</span>
                        <span class="overflow-hidden text-ellipsis whitespace-nowrap text-gray-4 hover:underline">@${tweet.UserName}</span>
                        <span class="text-gray-4 whitespace-nowrap">${formattedDate}</span>
                        ${deleteButtonHtml}
                    </a>
                    <p class="overflow-hidden text-sm text-ellipsis text-twitter-dark-gray dark:text-white-0">${tweet.TweetText}</p>
                    ${tweetImgHtml} ${tweetVidHtml}
                    <div class="flex gap-4 pb-3">
                        <button class="flex items-center gap-1 like-btn" data-tweet-id="${tweet.TweetId}">
                            <svg viewBox="0 0 24 24" aria-hidden="true" class="w-8 p-[0.375rem] rounded-full ${tweet.IsLiked ? 'fill-red-0' : 'fill-white stroke-red-500'} group-hover:bg-blue-1 group-dark:hover:bg-blue-0">
                                <g>
                                    <path d="${tweet.IsLiked
            ? 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
            : 'M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z'}"></path>
                                </g>
                            </svg>
                            <span class="text-red-0 like-count">${tweet.LikeCount}</span>
                        </button>

                        <button class="flex items-center group comment-btn" data-tweet-id="${tweet.TweetId}" data-comment-count="${tweet.CommentCount}">
                            <svg viewBox="0 0 24 24" aria-hidden="true" class="w-8 p-[0.375rem] transition rounded-full fill-gray-4 group-hover:fill-primary group-hover:bg-blue-1 group-dark:hover:bg-blue-0">
                                <g>
                                    <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"></path>
                                </g>
                            </svg>
                            <div class="transition text-gray-4 group-hover:text-primary comment-count">${tweet.CommentCount}</div>
                        </button>
                        <button class="flex items-center gap-1 invisible">
                            <svg viewBox="0 0 24 24" aria-hidden="true" class="w-8 p-[0.375rem] rounded-full fill-primary">
                                <path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div class="comments" id="comments-${tweet.TweetId}"></div>`;

    $('#' + targetElementId).prepend(tweetHtml);
}

function getDeleteButtonHtml(tweetUserId, loggedInUserId, tweetId) {

    if (tweetUserId === loggedInUserId) {
        return `
            <button class="justify-self-end delete-btn" data-tweet-id="${tweetId}">
                <svg class="w-8 p-[0.375rem] transition rounded-full fill-gray-4 hover:fill-red-3 hover:bg-red-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
                    <g>
                        <path d="M16 6V4.5C16 3.12 14.88 2 13.5 2h-3C9.11 2 8 3.12 8 4.5V6H3v2h1.06l.81 11.21C4.98 20.78 6.28 22 7.86 22h8.27c1.58 0 2.88-1.22 3-2.79L19.93 8H21V6h-5zm-6-1.5c0-.28.22-.5.5-.5h3c.27 0 .5.22.5.5V6h-4V4.5zm7.13 14.57c-.04.52-.47.93-1 .93H7.86c-.53 0-.96-.41-1-.93L6.07 8h11.85l-.79 11.07zM9 17v-6h2v6H9zm4 0v-6h2v6h-2z">
                        </path>
                    </g>
                </svg>
            </button>`;
    }
    return '';
}

function getDeleteButtonOnComment(commentUserId, loggedInUserId, commentId, tweet, comment) {
    if (loggedInUserId == comment.UserId || (commentUserId != tweet.UserId || commentUserId === loggedInUserId || tweet.UserId === loggedInUserId)) {
        return `
        <button class="justify-self-end delete-comment-btn" data-comment-id="${commentId}">
            <svg class="w-8 p-[0.375rem] transition rounded-full fill-gray-4 hover:fill-red-3 hover:bg-red-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
                <g>
                    <path d="M16 6V4.5C16 3.12 14.88 2 13.5 2h-3C9.11 2 8 3.12 8 4.5V6H3v2h1.06l.81 11.21C4.98 20.78 6.28 22 7.86 22h8.27c1.58 0 2.88-1.22 3-2.79L19.93 8H21V6h-5zm-6-1.5c0-.28.22-.5.5-.5h3c.27 0 .5.22.5.5V6h-4V4.5zm7.13 14.57c-.04.52-.47.93-1 .93H7.86c-.53 0-.96-.41-1-.93L6.07 8h11.85l-.79 11.07zM9 17v-6h2v6H9zm4 0v-6h2v6h-2z">
                    </path>
                </g>
            </svg>
        </button>`;
    }
    return '';
}

function prependComment(comment, tweetId, tweet) {
    var formattedDate = formatTweetDate(comment.CommentDate);
    var deleteButtonHtml = getDeleteButtonOnComment(comment.UserId, currentUser, comment.CommentId, tweet, comment);

    var commentHtml = `
    <div class="flex gap-4 border-l-4 pl-5 border-blue-500 pb-2 dark:border-black-5 px-5 pt-4 hover:bg-gray-7 dark:hover:bg-black-6 comments" style="width:94%; margin-left: auto;" id="comment-${comment.CommentId}">
        <a class="flex flex-col items-center gap-1 mb-2">
            <figure class="w-12 h-12 rounded-full hover:bg-black-0">
                <img src="${comment.ProfilePic}" alt="Profile photo" class="w-full h-full rounded-full hover:opacity-80" />
            </figure>
        </a>
        <div class="flex flex-col flex-1 gap-2">
            <div class="flex flex-col gap-3">
                <div class="flex flex-col gap-1">
                    <a class="grid items-center grid-flow-col gap-2 auto-cols-auto-auto-1fr">
                        <span class="overflow-hidden font-bold text-ellipsis whitespace-nowrap hover:underline dark:text-white-0">${comment.FirstName}</span>
                        <span class="overflow-hidden text-ellipsis whitespace-nowrap text-gray-4 hover:underline">@${comment.UserName}</span>
                        <span class="overflow-hidden text-gray-4 whitespace-nowrap">
                            ${formattedDate}
                        </span>
                        <button class='reply-btn' data-tweet-id="${tweetId}" data-comment-id="${comment.CommentId}">
                            <svg class="h-5 w-5 text-blue-500"  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                            </svg>
                        </button>
                    </a>
                    <p class="overflow-hidden text-sm text-ellipsis text-twitter-dark-gray dark:text-white-0">${comment.CommentText}</p>
                </div>
            </div>
        </div>
        ${deleteButtonHtml}
        </div>
        <div class="replies gap-4 border-l-4 border-blue-500 dark:border-black-5 comments" data-tweet-id="${tweetId}" style="width: 87%; margin-left: auto;" id="replies-${comment.CommentId}"></div>`;

    $('#comments-' + tweetId).append(commentHtml);
}

//COMMENT REPLY
$(document).ready(function () {
    function openReplyModal() {

        $('#replyText').val('');
        $('#spnCommentReplyModal').html('');
        $('#replyModal').removeClass('hidden');
    }

    function closeReplyModal() {

        $('#replyText').val('');
        $('#spnCommentReplyModal').html('');
        $('#replyModal').addClass('hidden');
    }

    $('.closeModalBtn').on('click', closeReplyModal);

    $(document).on('click', '.reply-btn', function () {
        var commentId = $(this).data('comment-id');
        var tweetId = $(this).data('tweet-id');

        $('#modalReplyUserId').val(currentUser);
        $('#modalReplyCommentId').val(commentId);
        $('#modalReplyTweetId').val(tweetId);
        openReplyModal();
    });

    $(document).on('click', '#submitReplyBtn', function () {
        var commentId = $('#modalReplyCommentId').val();
        var replyText = $('#replyText').val();
        var tweetId = $('#modalReplyTweetId').val();
        var loggedInUserId = $('#modalReplyUserId').val();



        if ($('#replyText').val().trim() == '') {
            $('#spnCommentReplyModal').html("Reply can't be empty!")
        }
        else {
            $('#spnCommentReplyModal').html('');
            $.ajax({
                url: '/Homepage/UserReplyComment',
                type: 'POST',
                data: {
                    commentId: commentId,
                    replyText: replyText,
                    tweetId: tweetId
                },
                success: function (response) {
                    $('#replyText').val('');
                    if (response.success) {
                        prependReply(response.reply, commentId, tweetId);

                        updateCommentCount(tweetId, response.commentCount);
                    }
                    closeReplyModal();
                },
                error: function () {
                    $('#replyText').val('');
                    closeReplyModal();
                }
            });
        }
    });
});

function prependReply(reply, commentId, tweetId, tweet) {
    var formattedDate = formatTweetDate(reply.ReplyDate);
    var deleteButtonHtml = getDeleteButtonOnReply(reply.UserId, currentUser, reply.ReplyId, commentId, tweetId, tweet);

    var replyHtml = `
    <div class="flex gap-4 border-grey-9 dark:border-black-5 px-5 pt-4 hover:bg-gray-7 dark:hover:bg-black-6 comments"  id="reply-${reply.ReplyId}">
        <a class="flex flex-col items-center px-4 gap-1 mb-2" href="#">
            <figure class="w-12 h-12 rounded-full hover:bg-black-0">
                <img src="${reply.ProfilePic}" alt="Profile photo" class="w-full h-full rounded-full hover:opacity-80" />
            </figure>
        </a>
        <div class="flex flex-col flex-1 gap-2">
            <div class="flex flex-col gap-3">
                <div class="flex flex-col gap-1">
                    <a class="grid items-center grid-flow-col gap-2 auto-cols-auto-auto-1fr" href="#">
                        <span class="overflow-hidden font-bold text-ellipsis whitespace-nowrap hover:underline dark:text-white-0">${reply.FirstName}</span>
                        <span class="overflow-hidden text-ellipsis whitespace-nowrap text-gray-4 hover:underline">@${reply.UserName}</span>
                        <span class="overflow-hidden text-gray-4 whitespace-nowrap">
                            ${formattedDate}
                        </span>
                       
                    </a>
                    <p class="overflow-hidden text-sm text-ellipsis text-twitter-dark-gray dark:text-white-0">${reply.ReplyText}</p>
                    
                </div>
            </div>
        </div>
        ${deleteButtonHtml}
    </div>`;

    $('#replies-' + commentId).append(replyHtml);
}

//DELETE REPLY HTML
function getDeleteButtonOnReply(replyUserId, loggedInUserId, replyId, commentId, tweetId, tweet) {

    if (replyUserId === loggedInUserId || tweet.UserId === loggedInUserId) {
        return `
        <button class="justify-self-end delete-reply-btn" data-reply-id="${replyId}" data-reply-comment-id="${commentId}" data-reply-tweet-id="${tweetId}">
            <svg class="w-8 p-[0.375rem] transition rounded-full fill-gray-4 hover:fill-red-3 hover:bg-red-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
                <g>
                    <path d="M16 6V4.5C16 3.12 14.88 2 13.5 2h-3C9.11 2 8 3.12 8 4.5V6H3v2h1.06l.81 11.21C4.98 20.78 6.28 22 7.86 22h8.27c1.58 0 2.88-1.22 3-2.79L19.93 8H21V6h-5zm-6-1.5c0-.28.22-.5.5-.5h3c.27 0 .5.22.5.5V6h-4V4.5zm7.13 14.57c-.04.52-.47.93-1 .93H7.86c-.53 0-.96-.41-1-.93L6.07 8h11.85l-.79 11.07zM9 17v-6h2v6H9zm4 0v-6h2v6h-2z">
                    </path>
                </g>
            </svg>
        </button>`;
    }
    return '';
}
$(document).on('click', '.delete-reply-btn', function () {
    var commentReplyId = $(this).data('reply-id');
    var commentId = $(this).data('reply-comment-id');
    var tweetId = $(this).data('reply-tweet-id');
    var replyCommentElement = $(this).closest(`#reply-${commentReplyId}`);

    // Send AJAX request to delete the comment reply
    $.ajax({
        url: '/Homepage/DeleteCommentReply',
        type: 'POST',
        data: {
            tweetId: tweetId,
            commentId: commentId,
            commentReplyId: commentReplyId
        },
        success: function (response) {
            if (response.success) {
                // Upon successful deletion, remove the reply element from the DOM
                replyCommentElement.remove();

                // Update the comment count
                updateCommentCount(tweetId, response.commentCount);
            } else {
                console.error(response.message);
            }
        },
        error: function (xhr, status, error) {
            console.error(error);
        }
    });
});

//// Execute the showLoader function before sending any AJAX request
//$(document).ajaxStart(function () {
//    showLoader();
//});

//// Execute the hideLoader function when any AJAX request completes
//$(document).ajaxStop(function () {
//    hideLoader();
//});

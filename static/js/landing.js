function post(url, data, method='POST') {
    return $.ajax({
        method: method,
        url: url,
        data: JSON.stringify(data),
        contentType: 'application/json',
    });
}

const auth = {
    init() {
        return new Promise((resolve, reject) => {
            firebase.auth().onAuthStateChanged(user => {
                if (user) {
                    this.user = user;
                    this.userId = user.uid;

                    const userData = {
                        user_id: user.uid,
                        display_name: user.displayName,
                        photo_url: user.photoURL,
                        email: user.email,
                    };

                    $.get(userApi, { user_id: user.uid }).promise()
                        .then((response) => {
                            let postPromise;
                            if (response.length > 0) {
                                userApi = userApi + response[0].pk + '/';
                                postPromise = post(userApi, userData, 'PUT');
                            } else {
                                postPromise = post(userApi, userData);
                            }

                            postPromise.then((response) => {
                                this.userPk = response.pk;
                                resolve();
                            }).catch((e) => reject(e));
                        })
                        .catch((e) => reject(e));
                }
                else {
                    let provider = new firebase.auth.GoogleAuthProvider();
                    firebase.auth().signInWithRedirect(provider);
                }
            });

            // Next handle the redirect result in case of error
            firebase.auth().getRedirectResult().then((result) => {
                this.user = result.user;
                if (result.user) {
                    this.userId = result.user.uid;
                }
            }).catch(error => {
                let errorCode = error.code;
                let errorMessage = error.message;
                let email = error.email;
                let credential = error.credential;

                reject("Error\n" + "Code:" + errorCode + "\n" + "Message: " + errorMessage);
            });
        });
    },
};


const teams = {
    init() {
        $('#add-new-team').click(() => {
            const teamName = $('#new-team-name').val();
            this.addTeam(teamName);
        });

        return new Promise((resolve, reject) => {
            $.get(teamApi, { user_id: auth.userId }).promise()
                .then(response => {
                    response.forEach(team => this.loadTeam(team));
                })
                .catch(e => reject(e));
        });
    },

    loadTeam(team) {
        const teamElement = $('<a></a>');
        teamElement.attr('href', '/' + team.slug);
        teamElement.text(team.name);
        teamElement.appendTo('#team-list .list');
    },

    addTeam(teamName) {
        if (teamName && teamName.trim()) {
            const teamData = {
                name: teamName,
                members: [ auth.userPk, ],
            };
            post(teamApi, teamData).promise()
                .then(response => {
                    this.loadTeam(response);
                })
                .catch(e => console.log(e));
        }
    },
};


function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

$(document).ready(() => {
    const csrftoken = $('[name=csrfmiddlewaretoken]').val();
    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    auth.init()
        .then(() => teams.init())
        .catch(e => console.log(e));
});

let database = {
    init: function($scope, $http) {
        $scope.db = this;
        this.scope = $scope;
        this.http = $http;

        this.projects = [];
        this.tasks = [];
    },

    loadAll: function() {
        let that = this;
        return this.loadTeams().then(function() {
            return that.loadProjects();
        }).then(function() {
            return that.loadPhases();
        }).then(function() {
            return that.loadTasks();
        }).then(function() {
            that.reloadTasksIntoProjects();
            that.projects.forEach(p => that.gotoFirstPhase(p));
        });
    },

    loadTeams: function() {
        let that = this;
        return new Promise(function(resolve, reject) {
            that.http.get(teamApi, { params: {user_id: auth.userId, team_id: teamId} }).then(
                function success(response) {
                    if (response.data) {
                        that.teams = response.data;
                        resolve();
                        that.refreshMembers();
                    } else {
                        reject('Failed to load teams\n' + JSON.stringify({response: response}));
                    }
                },
                function error(response) {
                    reject('Failed to load teams\n' + JSON.stringify({response: response}));
                }
            );
        });
    },

    loadProjects: function() {
        let that = this;
        return new Promise(function(resolve, reject) {
            that.http.get(projectApi, { params: { user_id: auth.userId, team_id: teamId } }).then(
                function success(response) {
                    if (response.data) {
                        that.projects = response.data;
                        resolve();
                    } else {
                        reject('Failed to load projects\n' + JSON.stringify({response: response}));
                    }
                },
                function error(response) {
                    reject('Failed to load projects\n' + JSON.stringify({response: response}));
                }
            );
        });
    },

    loadPhases: function() {
        let that = this;
        return new Promise(function(resolve, reject) {
            that.http.get(phaseApi, { params: { user_id: auth.userId, team_id: teamId } }).then(
                function success(response) {
                    if (response.data) {
                        that.phases = response.data;
                        resolve();
                    } else {
                        reject('Failed to load phases\n' + JSON.stringify({response: response}));
                    }
                },
                function error(response) {
                    reject('Failed to load phases\n' + JSON.stringify({response: response}));
                }
            );
        });
    },

    loadTasks: function() {
        let that = this;
        return new Promise(function(resolve, reject) {
            that.http.get(taskApi, { params: { user_id: auth.userId, team_id: teamId } }).then(
                function success(response) {
                    if (response.data) {
                        that.tasks = response.data;
                        resolve();
                    } else {
                        reject('Failed to load tasks\n' + JSON.stringify({response: response}));
                    }
                },
                function error(response) {
                    reject('Failed to load tasks\n' + JSON.stringify({response: response}));
                }
            );
        });
    },

    reloadTasksIntoProjects: function() {
        for (let i=0; i<this.projects.length; i++) {
            this.projects[i].phases = [];
        }
        for (let i=0; i<this.phases.length; i++) {
            let phase = this.phases[i];
            let project = this.projects.find(p => p.pk == phase.project);
            if (project) {
                project.phases.push(phase);
            }
        }

        for (let i=0; i<this.phases.length; i++) {
            this.phases[i].tasks = [];
        }

        for (let i=0; i<this.tasks.length; i++) {
            let task = this.tasks[i];
            let phase = this.phases.find(p => p.pk == task.phase);
            if (phase) {
                phase.tasks.push(task);
            }
            this.refreshTask(task);
        }

        this.projects.forEach(p => {
            if (p.phases && p.phases.length > 0) {
                p.activePhaseId = p.phases[0].pk;
            }
        });
    },

    startPhase: function(projectId) {
        let phase = {
            name: 'New phase',
            project: projectId,
        };
        let that = this;

        return new Promise((resolve, reject) => {
            that.http.post(phaseApi, phase).then(
                function success(response) {
                    that.phases.unshift(response.data);
                    that.reloadTasksIntoProjects();
                    resolve();

                    let project = that.projects.find(p => p.pk == response.data.project);
                    if (project) that.gotoFirstPhase(project);
                },

                function error(response) {
                    reject('Cannot start new phase\n' + JSON.stringify({response: response}));
                }
            );
        });
    },

    addProject: function(teamId, name) {
        if (!name || name.length === 0)
            return;

        let project = {
            name: name,
            team: teamId
        };
        let that = this;

        return new Promise((resolve, reject) => {
            that.http.post(projectApi, project).then(
                function success(response) {
                    that.projects.push(response.data);
                    resolve();
                },
                function error(response) {
                    reject('Cannot start project\n' + JSON.stringify({response: response}));
                }
            );
        });
    },

    deleteProject: function(projectId) {
        let that = this;

        if (!confirm('Deleting this project will delete it for all members. Are you sure you want to do this?')) {
            return;
        }

        return new Promise((resolve, reject) => {
            that.http.delete(projectApi + projectId + '/').then(
                function success(response) {
                    let index = that.projects.findIndex(p => p.pk == projectId);
                    if (index >= 0) {
                        that.projects.splice(index, 1);
                    }
                    resolve();
                },
                function error(response) {
                    reject('Cannot delete project\n' + JSON.stringify({response: response}));
                }
            );
        });
    },

    addTask: function(phaseId, name) {
        if (!name || name.length === 0)
            return;

        let task = {
            name: name,
            phase: phaseId,
        };
        let that = this;

        return new Promise((resolve, reject) => {
            that.http.post(taskApi, task).then(
                function success(response) {
                    that.tasks.push(response.data);
                    let phase = that.phases.find(p => p.pk == phaseId);
                    if (!phase.tasks) {
                        phase.tasks = [];
                    }
                    phase.tasks.push(response.data);
                    that.refreshTask(response.data);
                    resolve();
                },
                function error(response) {
                    reject('Cannot add task\n' + JSON.stringify({response: response}));
                }
            );
        });
    },

    editPhase: function(phaseId) {
        let phase = this.phases.find(p => p.pk == phaseId);
        if (!phase) {
            return;
        }

        this.scope.editPhaseName = phase.name;
        let that = this;
        let modal = new Modal(document.getElementById('edit-phase-modal'), progressClick);
        modal.show((action) => {
            if (action == 'save') {
                let newPhase = {
                    pk: phase.pk,
                    name: that.scope.editPhaseName,
                    project: phase.project,
                };

                return new Promise((resolve, reject) => {
                    that.http.put(phaseApi + phaseId + '/', newPhase).then(
                        function success(response) {
                            let index = that.phases.findIndex(p => p.pk = phaseId);
                            that.phases[index] = response.data;
                            that.reloadTasksIntoProjects();
                            resolve();
                        },
                        function error(response) {
                            reject('Cannot edit phase\n' + JSON.stringify({response: response}));
                        }
                    );
                });
            }
            else if (action == 'delete') {
                let promise = that.deletePhase(phaseId);
                if (promise) {
                    return promise.then(() => {
                        modal.close('delete');
                    });
                }
                return promise;
            }
        });
    },

    editTask: function(taskId) {
        let task = this.tasks.find(t => t.pk == taskId);
        if (!task) {
            return;
        }

        this.scope.editTaskName = task.name;

        let that = this;
        let modal = new Modal(document.getElementById('edit-task-modal'), progressClick);
        modal.show((action) => {
            if (action == 'save') {
                let newTask = {
                    pk: taskId,
                    name: that.scope.editTaskName,
                    phase: task.phase,
                };

                return new Promise((resolve, reject) => {
                    that.http.put(taskApi + taskId + '/', newTask).then(
                        function success(response) {
                            response.data.entries = task.entries;

                            let index = that.tasks.findIndex(t => t.pk == taskId);
                            that.tasks[index] = response.data;
                            let phase = that.phases.find(p => p.pk == task.phase);
                            index = phase.tasks.findIndex(t => t.pk == taskId);
                            phase.tasks[index] = response.data;
                            that.refreshTask(task);

                            resolve();
                        },
                        function error(response) {
                            reject('Cannot edit task\n' + JSON.stringify({response: response}));
                        }
                    );
                });
            }

            else if (action == 'delete') {
                let promise = that.deleteTask(taskId);
                if (promise) {
                    return promise.then(() => {
                        modal.close('delete');
                    });
                }
                return promise;
            }
        });
    },

    deletePhase: function(phaseId) {
        let that = this;

        if (!confirm('Deleting this phase will delete all of its tasks for all members. Are you absolutely sure?')) {
            return;
        }

        return new Promise((resolve, reject) => {
            that.http.delete(phaseApi + phaseId + '/').then(
                function success(response) {
                    let index = that.phases.findIndex(p => p.pk == phaseId);
                    let projectId = that.phases[index].project;

                    that.phases.splice(index, 1);
                    that.reloadTasksIntoProjects();
                    resolve();

                    let project = that.projects.find(p => p.pk == projectId);
                    if (project) that.gotoFirstPhase(project);
                },

                function error(response) {
                    reject('Cannot delete phase\n' + JSON.stringify({response: response}));
                }
            );
        });
    },

    deleteTask: function(taskId) {
        let that = this;

        if (!confirm('Deleting this task will delete it for all members. Are you sure you want to do this?')) {
            return;
        }

        return new Promise((resolve, reject) => {
            that.http.delete(taskApi + taskId + '/').then(
                function success(response) {
                    let index = that.tasks.findIndex(t => t.pk == taskId);
                    let phase = that.phases.find(p => p.pk == that.tasks[index].phase);
                    let index2 = phase.tasks.findIndex(t => t.pk == taskId);
                    phase.tasks.splice(index2, 1);
                    that.tasks.splice(index, 1);

                    resolve();
                },
                function error(response) {
                    reject('Cannot delete task\n' + JSON.stringify({response: response}));
                }
            );
        });
    },

    startTask: function(taskId) {
        let taskEntry = {
            task: taskId,
            user: auth.userPk, start_time: new Date().toISOString().split('.')[0],
        };
        let that = this;

        return new Promise((resolve, reject) => {
            that.http.post(entryApi, taskEntry).then(
                function success(response) {
                    let task = that.tasks.find(t => t.pk == taskId);
                    task.entries.push(response.data);

                    that.refreshTask(task);
                    resolve();
                },
                function error(response) {
                    reject('Cannot start task\n' + JSON.stringify({response: response}));
                }
            );
        });
    },

    stopTask: function(taskId, entryId) {
        let task = this.tasks.find(t => t.pk == taskId);
        if (!task)
            return;

        let entry = null;
        if (!entryId) {
            entry = task.entries.find(e => !e.end_time);
            entryId = entry.pk;
        }
        else {
            entry = task.entries.find(e => e.pk == entryId);
        }

        if (!entry)
            return;

        let taskEntry = {
            pk: entryId, task: taskId,
            user: auth.userPk,
            start_time: entry.start_time,
            end_time: new Date().toISOString().split('.')[0],
        };

        let that = this;

        return new Promise((resolve, reject) => {
            that.http.put(entryApi + entryId + '/', taskEntry).then(
                function success(response) {
                    let task = that.tasks.find(t => t.pk == taskId);
                    let index = task.entries.findIndex(e => e.pk == entryId);
                    task.entries[index] = response.data;
                    that.refreshTask(task);
                    resolve();
                },
                function error(response) {
                    reject('Cannot stop task\n' + JSON.stringify({response: response}));
                }
            );
        });
    },

    deleteTaskEntry: function(taskId, entryId) {
        let that = this;
        return new Promise((resolve, reject) => {
            that.http.delete(entryApi + entryId + '/').then(
                function success(response) {
                    let task = that.tasks.find(t => t.pk == taskId);
                    let index = task.entries.findIndex(e => e.pk == entryId);
                    task.entries.splice(index, 1);
                    that.refreshTask(task);
                    resolve();
                },
                function error(response) {
                    reject('Cannot delete entryy\n' + JSON.stringify({response: response}));
                }
            );
        });
    },

    editTaskEntry: function(taskId, entryId) {
        let task = this.tasks.find(t => t.pk == taskId);
        if (!task)
            return;

        let entry = null;
        if (!entryId) {
            entry = task.entries.find(e => !e.end_time);
            entryId = entry.pk;
        }
        else {
            entry = task.entries.find(e => e.pk == entryId);
        }

        if (!entry)
            return;

        this.scope.editEntryStartTime = new Date(entry.start_time);
        this.scope.editEntryEndTime = (entry.end_time)?new Date(entry.end_time):null;

        let that = this;
        new Modal(document.getElementById('edit-entry-modal'), progressClick)
            .show((action) => {
                if (action == 'save') {
                    let taskEntry = {
                        pk: entryId, task: taskId,
                        user: auth.userPk,
                        start_time: that.scope.editEntryStartTime.toISOString().split('.')[0],
                        end_time: null,
                    };
                    if (that.scope.editEntryEndTime) {
                        taskEntry.end_time = that.scope.editEntryEndTime.toISOString().split('.')[0];
                    }

                    return new Promise((resolve, reject) => {
                        that.http.put(entryApi + entryId + '/', taskEntry).then(
                            function success(response) {
                                let task = that.tasks.find(t => t.pk == taskId);
                                let index = task.entries.findIndex(e => e.pk == entryId);
                                task.entries[index] = response.data;
                                that.refreshTask(task);
                                resolve();
                            },
                            function error(response) {
                                reject('Cannot edit task\n' + JSON.stringify({response: response}));
                            }
                        );
                    });
                }
            });
    },

    gotoFirstPhase(project) {
        if (project.phases && project.phases.length > 0) {
            this.scope.phaseTab[project.pk] = project.phases[0].pk;
        }
    },

    refreshTask(task) {
        if (!task.entries) {
            task.entries = [];
        }

        task.running = !(!task.entries.find(e => !e.end_time));
        task.entries.sort((e1, e2) => (new Date(e2.start_time) - new Date(e1.start_time)));
        task.entries.forEach((e) => {
            if (e.end_time && e.end_time < e.start_time) {
                e.end_time = e.start_time;
            }

            if (e.end_time) {
                e.dt = getDiff(new Date(e.end_time), new Date(e.start_time));
            }
        });
    },

    refreshMembers() {
        const membersContainer = $('#edit-team-modal .members');
        membersContainer.empty();
        teamMembers.forEach(member => {
            const memberElement = $('<div>' + member.display_name + '</div>');

            if (member.user_id != auth.userId) {
                memberElement.append('<button class="delete"><span class="fa fa-times"></span></button>');
                memberElement.find('button').click(() => {
                    if (!confirm('Are you sure you want to remove ' + member.display_name + ' from this group?')) {
                        return;
                    }
                    this.putMembers(teamMembers.filter(m => m.pk != member.pk));
                });
            }

            membersContainer.append(memberElement);
        });
    },

    searchTeamMember(query) {
        const usersContainer = $('#edit-team-modal .searched-users');
        usersContainer.empty();

        if (query.length <= 3) {
            return;
        }
        
        $.get('/api/v1/users/?q=' + encodeURIComponent(query)).promise()
            .then((response) => {
                response.forEach(user => {
                    if (teamMembers.find(m => m.pk == user.pk)) {
                        return;
                    }

                    const userElement = $('<div>' + user.display_name + ' <button class="add"><span class="fa fa-plus"></span></button></div>');
                    userElement.find('button').click(() => {
                        this.putMembers(teamMembers.concat([user]));
                        this.scope.memberSearchQuery = '';
                        usersContainer.empty();
                    });
                    usersContainer.append(userElement);
                });
            });
    },

    putMembers(members) {
        const data = {
            name: this.scope.team.name,
            members: members.map(m => m.pk),
        };
        this.http.put(teamApi + teamId + '/', data).then(
            () => {
                teamMembers = members;
                this.refreshMembers();
            }
        );
    },
};


function prependZero(n) {
    if (n <= 9) {
        return '0' + n;
    }
    return '' + n;
}


function getDiff(date1, date2) {
    let diff = date1.getTime() - date2.getTime();
    let hh = Math.floor(diff/1000/60/60);

    diff -= hh*1000*60*60;
    let mm = Math.floor(diff/1000/60);

    diff -= mm*1000*60;
    let ss = Math.floor(diff/1000);

    return prependZero(hh) + ':' +
        prependZero(mm) + ':' +
        prependZero(ss);
}

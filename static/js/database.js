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
            return that.loadTasks();
        }).then(function() {
            that.reloadTasksIntoProjects();
        });
    },

    loadTeams: function() {
        let that = this;
        return new Promise(function(resolve, reject) {
            that.http.get(teamApi, { params: {user_id: auth.userId} }).then(
                function success(response) {
                    if (response.data) {
                        that.teams = response.data;
                        resolve();
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
            that.http.get(projectApi, { params: { user_id: auth.userId } }).then(
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

    loadTasks: function() {
        let that = this;
        return new Promise(function(resolve, reject) {
            that.http.get(taskApi, { params: { user_id: auth.userId } }).then(
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
            this.projects[i].tasks = [];
        }
        for (let i=0; i<this.tasks.length; i++) {
            let task = this.tasks[i];
            let project = this.projects.find(p => p.pk == task.project);
            if (project) {
                project.tasks.push(task);
            }

            this.refreshTask(task);
        }
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

    addTask: function(projectId, name) {
        if (!name || name.length === 0)
            return;

        let task = {
            name: name,
            project: projectId,
            plan_start: null, plan_end: null,
            active: false,
        };
        let that = this;

        return new Promise((resolve, reject) => {
            that.http.post(taskApi, task).then(
                function success(response) {
                    that.tasks.push(response.data);
                    let project = that.projects.find(p => p.pk == projectId);
                    if (!project.tasks) {
                        project.tasks = [];
                    }
                    project.tasks.push(response.data);
                    that.refreshTask(response.data);
                    resolve();
                },
                function error(response) {
                    reject('Cannot add task\n' + JSON.stringify({response: response}));
                }
            );
        });
    },

    editTask: function(taskId) {
        let task = this.tasks.find(t => t.pk == taskId);
        if (!task) {
            return;
        }

        this.scope.editTaskName = task.name;
        this.scope.editTaskPlanStart = task.plan_start ? new Date(task.plan_start) : null;
        this.scope.editTaskPlanEnd = task.plan_end ? new Date(task.plan_end) : null;
        this.scope.editTaskActive = task.active;

        let that = this;
        let modal = new Modal(document.getElementById('edit-task-modal'), progressClick);
        modal.show((action) => {
            if (action == 'save') {
                let newTask = {
                    pk: taskId,
                    name: that.scope.editTaskName,
                    project: task.project,
                    plan_start: that.scope.editTaskPlanStart ? that.scope.editTaskPlanStart.toISOString().split('T')[0] : null,
                    plan_end: that.scope.editTaskPlanEnd ? that.scope.editTaskPlanEnd.toISOString().split('T')[0] : null,
                    active: that.scope.editTaskActive,
                };

                return new Promise((resolve, reject) => {
                    that.http.put(taskApi + taskId + '/', newTask).then(
                        function success(response) {
                            response.data.entries = task.entries;

                            let index = that.tasks.findIndex(t => t.pk == taskId);
                            that.tasks[index] = response.data;
                            let project = that.projects.find(p => p.pk == task.project);
                            index = project.tasks.findIndex(t => t.pk == taskId);
                            project.tasks[index] = response.data;
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

    deleteTask: function(taskId) {
        let that = this;

        if (!confirm('Deleting this task will delete it for all members. Are you sure you want to do this?')) {
            return;
        }

        return new Promise((resolve, reject) => {
            that.http.delete(taskApi + taskId + '/').then(
                function success(response) {
                    let index = that.tasks.findIndex(t => t.pk == taskId);
                    let project = that.projects.find(p => p.pk == that.tasks[index].project);
                    let index2 = project.tasks.findIndex(t => t.pk == taskId);
                    project.tasks.splice(index2, 1);
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
                    task.active = true;

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

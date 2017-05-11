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
            that.http.get(teamApi, { params: {userId: auth.userId} }).then(
                function success(response) {
                    if (response.data.status) {
                        that.teams = response.data.data;
                        resolve();
                    } else {
                        reject('Failed to load teams\n' + JSON.stringify({response: response}))
                    }
                },
                function error(response) {
                    reject('Failed to load teams\n' + JSON.stringify({response: response}))
                }
            )
        });
    },

    loadProjects: function() {
        let that = this;
        return new Promise(function(resolve, reject) {
            that.http.get(projectApi, { params: { userId: auth.userId } }).then(
                function success(response) {
                    if (response.data.status) {
                        that.projects = response.data.data;
                        resolve();
                    } else {
                        reject('Failed to load projects\n' + JSON.stringify({response: response}))
                    }
                },
                function error(response) {
                    reject('Failed to load projects\n' + JSON.stringify({response: response}))
                }
            );
        });
    },

    loadTasks: function() {
        let that = this;
        return new Promise(function(resolve, reject) {
            that.http.get(taskApi, { params: { userId: auth.userId } }).then(
                function success(response) {
                    if (response.data.status) {
                        that.tasks = response.data.data;
                        resolve();
                    } else {
                        reject('Failed to load tasks\n' + JSON.stringify({response: response}));
                    }
                },
                function error(response) {
                    reject('Failed to load tasks\n' + JSON.stringify({response: response}))
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
            let project = this.projects.find(p => p.projectId == task.project);
            if (project) {
                project.tasks.push(task);
            }

            this.refreshTask(task);
        }
    },

    addProject: function(teamId, name) {
        if (!name || name.length == 0)
            return;

        let project = {
            projectId: null, name: name,
            team: teamId
        };
        let that = this;

        return new Promise((resolve, reject) => {
            that.http.post(projectApi, project).then(
                function success(response) {
                    that.projects.push(response.data.data.project);
                    resolve();
                },
                function error(response) {
                    reject('Cannot start project\n' + JSON.stringify({response: response}));
                }
            );
        });
    },

    deleteProject: function(projectId) {
        let project = { projectId: projectId };
        let that = this;

        if (!confirm('Deleting this project will delete it for all members. Are you sure you want to do this?')) {
            return;
        }

        return new Promise((resolve, reject) => {
            that.http.delete(projectApi, { data: JSON.stringify(project) }).then(
                function success(response) {
                    let index = that.projects.findIndex(p => p.projectId == projectId);
                    if (index >= 0) {
                        that.projects.splice(index, 1);
                    }
                    resolve();
                },
                function error(response) {
                    reject('Cannot delete project\n' + JSON.stringify({response: response}))
                }
            );
        });
    },

    addTask: function(projectId, name) {
        if (!name || name.length == 0)
            return;

        let task = {
            taskId: null, name: name,
            project: projectId,
            planStart: null, planEnd: null,
        };
        let that = this;

        return new Promise((resolve, reject) => {
            that.http.post(taskApi, task).then(
                function success(response) {
                    that.tasks.push(response.data.data.task);
                    let project = that.projects.find(p => p.projectId == projectId);
                    if (!project.tasks) {
                        project.tasks = [];
                    }
                    project.tasks.push(response.data.data.task);
                    that.refreshTask(response.data.data.task);
                    resolve();
                },
                function error(response) {
                    reject('Cannot add task\n' + JSON.stringify({response: response}))
                }
            );
        });
    },

    editTask: function(taskId) {
        let task = this.tasks.find(t => t.taskId == taskId);
        if (!task) {
            return;
        }

        this.scope.editTaskName = task.name;
        this.scope.editTaskPlanStart = task.planStart ? new Date(task.planStart) : null;
        this.scope.editTaskPlanEnd = task.planEnd ? new Date(task.planEnd) : null;

        let that = this;
        let modal = new Modal(document.getElementById('edit-task-modal'), progressClick);
        modal.show((action) => {
            if (action == 'save') {
                let newTask = {
                    taskId: taskId,
                    name: that.scope.editTaskName,
                    project: task.project,
                    planStart: that.scope.editTaskPlanStart ? Math.floor(that.scope.editTaskPlanStart.getTime()) : null,
                    planEnd: that.scope.editTaskPlanEnd ? Math.floor(that.scope.editTaskPlanEnd.getTime()) : null,
                };

                return new Promise((resolve, reject) => {
                    that.http.post(taskApi, newTask).then(
                        function success(response) {
                            response.data.data.task.entries = task.entries;

                            let index = that.tasks.findIndex(t => t.taskId == taskId);
                            that.tasks[index] = response.data.data.task;
                            let project = that.projects.find(p => p.projectId == task.project);
                            index = project.tasks.findIndex(t => t.taskId == taskId);
                            project.tasks[index] = response.data.data.task;
                            that.refreshTask(task);
                            resolve();
                        },
                        function error(response) {
                            reject('Cannot edit task\n' + JSON.stringify({response: response}))
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
        let task = { taskId: taskId };
        let that = this;

        if (!confirm('Deleting this task will delete it for all members. Are you sure you want to do this?')) {
            return;
        }

        return new Promise((resolve, reject) => {
            that.http.delete(taskApi, { data: JSON.stringify(task) }).then(
                function success(response) {
                    let index = that.tasks.findIndex(t => t.taskId == taskId);
                    let project = that.projects.find(p => p.projectId == that.tasks[index].project);
                    let index2 = project.tasks.findIndex(t => t.taskId == taskId);
                    project.tasks.splice(index2, 1);
                    that.tasks.splice(index, 1);

                    resolve();
                },
                function error(response) {
                    reject('Cannot delete task\n' + JSON.stringify({response: response}))
                }
            );
        });
    },

    startTask: function(taskId) {
        let taskEntry = {
            entryId: null, task: taskId,
            user: auth.userId, startTime: Math.floor(Date.now()),
        };
        let that = this;

        return new Promise((resolve, reject) => {
            that.http.post(entryApi, taskEntry).then(
                function success(response) {
                    let task = that.tasks.find(t => t.taskId == taskId);
                    task.entries.push(response.data.data.entry);
                    that.refreshTask(task);
                    resolve();
                },
                function error(response) {
                    reject('Cannot start task\n' + JSON.stringify({response: response}))
                }
            );
        });
    },

    stopTask: function(taskId, entryId) {
        let task = this.tasks.find(t => t.taskId == taskId);
        if (!task)
            return;

        let entry = null;
        if (!entryId) {
            entry = task.entries.find(e => !e.endTime);
            entryId = entry.entryId;
        }
        else {
            entry = task.entries.find(e => e.entryId == entryId);
        }

        if (!entry)
            return;

        let taskEntry = {
            entryId: entryId, task: taskId,
            user: auth.userId,
            startTime: parseInt(entry.startTime),
            endTime: Math.floor(Date.now()),
        };

        let that = this;

        return new Promise((resolve, reject) => {
            that.http.post(entryApi, taskEntry).then(
                function success(response) {
                    let task = that.tasks.find(t => t.taskId == taskId);
                    let index = task.entries.findIndex(e => e.entryId == entryId);
                    task.entries[index] = response.data.data.entry;
                    that.refreshTask(task);
                    resolve();
                },
                function error(response) {
                    reject('Cannot stop task\n' + JSON.stringify({response: response}))
                }
            );
        });
    },

    deleteTaskEntry: function(taskId, entryId) {
        let entry = { entryId: entryId };
        let that = this;
        return new Promise((resolve, reject) => {
            that.http.delete(entryApi, { data: JSON.stringify(entry) }).then(
                function success(response) {
                    let task = that.tasks.find(t => t.taskId == taskId);
                    let index = task.entries.findIndex(e => e.entryId == entryId);
                    task.entries.splice(index, 1);
                    that.refreshTask(task);
                    resolve();
                },
                function error(response) {
                    reject('Cannot delete entryy\n' + JSON.stringify({response: response}))
                }
            );
        });
    },

    editTaskEntry: function(taskId, entryId) {
        let task = this.tasks.find(t => t.taskId == taskId);
        if (!task)
            return;

        let entry = null;
        if (!entryId) {
            entry = task.entries.find(e => !e.endTime);
            entryId = entry.entryId;
        }
        else {
            entry = task.entries.find(e => e.entryId == entryId);
        }

        if (!entry)
            return;

        this.scope.editEntryStartTime = new Date(entry.startTime);
        this.scope.editEntryEndTime = (entry.endTime)?new Date(entry.endTime):null;

        let that = this;
        new Modal(document.getElementById('edit-entry-modal'), progressClick)
            .show((action) => {
                if (action == 'save') {
                    let taskEntry = {
                        entryId: entryId, task: taskId,
                        user: auth.userId,
                        startTime: Math.floor(that.scope.editEntryStartTime.getTime())
                    };
                    if (that.scope.editEntryEndTime) {
                        taskEntry.endTime = Math.floor(that.scope.editEntryEndTime.getTime());
                    }

                    return new Promise((resolve, reject) => {
                        that.http.post(entryApi, taskEntry).then(
                            function success(response) {
                                let task = that.tasks.find(t => t.taskId == taskId);
                                let index = task.entries.findIndex(e => e.entryId == entryId);
                                task.entries[index] = response.data.data.entry;
                                that.refreshTask(task);
                                resolve();
                            },
                            function error(response) {
                                reject('Cannot edit task\n' + JSON.stringify({response: response}))
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

        task.active = !(!task.entries.find(e => !e.endTime));
        task.entries.sort((e1, e2) => (e2.startTime - e1.startTime));
        task.entries.forEach((e) => {
            if (e.endTime && e.endTime < e.startTime) {
                e.endTime = e.startTime;
            }
        });
    },
};

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
            if (project)
                project.tasks.push(task);
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
        that.http.post(projectApi, project).then(
            function success(response) {
                that.loadAll().then(function() {
                    that.scope.$apply();
                }).catch(function(error) {
                    console.log(error);
                });
            },
            function error(response) {
                console.log("Cannot start project\n" + JSON.stringify({response: response}))
            }
        );
    },

    deleteProject: function(projectId) {
        let project = { projectId: projectId };
        let that = this;
        that.http.delete(projectApi, { data: JSON.stringify(project) }).then(
            function success(response) {
                that.loadAll().then(function() {
                    that.scope.$apply();
                }).catch(function(error) {
                    console.log(error);
                });
            },
            function error(response) {
                console.log("Cannot delete project\n" + JSON.stringify({response: response}))
            }
        );
    },

    addTask: function(projectId, name) {
        if (!name || name.length == 0)
            return;
            
        let task = {
            taskId: null, name: name,
            project: projectId
        };
        let that = this;
        that.http.post(taskApi, task).then(
            function success(response) {
                that.loadAll().then(function() {
                    that.scope.$apply();
                }).catch(function(error) {
                    console.log(error);
                });
            },
            function error(response) {
                console.log("Cannot add task\n" + JSON.stringify({response: response}))
            }
        );
    },

    deleteTask: function(taskId) {
        let task = { taskId: taskId };
        let that = this;
        that.http.delete(taskApi, { data: JSON.stringify(task) }).then(
            function success(response) {
                that.loadAll().then(function() {
                    that.scope.$apply();
                }).catch(function(error) {
                    console.log(error);
                });
            },
            function error(response) {
                console.log("Cannot delete task\n" + JSON.stringify({response: response}))
            }
        );
    },

    startTask: function(taskId) {
        let taskEntry = {
            entryId: null, task: taskId,
            user: auth.userId, startTime: Math.floor(Date.now()/1000),
        };
        let that = this;
        that.http.post(entryApi, taskEntry).then(
            function success(response) {
                that.loadAll().then(function() {
                    that.scope.$apply();
                }).catch(function(error) {
                    console.log(error);
                });
            },
            function error(response) {
                console.log("Cannot start task\n" + JSON.stringify({response: response}))
            }
        );
    },

    stopTask: function(taskId, entryId) {
        let task = this.tasks.find(t => t.taskId == taskId);
        if (!task)
            return;

        let entry = task.entries.find(e => e.entryId == entryId);
        if (!entry)
            return;

        let taskEntry = {
            entryId: entryId, task: taskId,
            user: auth.userId,
            startTime: parseInt(entry.startTime),
            endTime: Math.floor(Date.now()/1000),
        };

        let that = this;
        that.http.post(entryApi, taskEntry).then(
            function success(response) {
                that.loadAll().then(function() {
                    that.scope.$apply();
                }).catch(function(error) {
                    console.log(error);
                });
            },
            function error(response) {
                console.log("Cannot start task\n" + JSON.stringify({response: response}))
            }
        );
    }
};

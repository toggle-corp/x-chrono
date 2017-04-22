class Modal {
    constructor(modalContainer, progressClick=null) {
        let that = this;
        this.container = modalContainer;
        this.container.style.display = 'none';
        this.modal = this.container.querySelector('.modal');

        this.resolve = null;
        this.reject = null;
        this.progressClick = progressClick;

        let buttons = this.modal.querySelectorAll('button');
        for (let i=0; i<buttons.length; i++) {
            let button = buttons[i];
            if (button.dataset.modalAction) {
                button.onclick = () => {
                    if (that.handler) {
                        let promise = that.handler(button.dataset.modalAction);
                        if (!promise) {
                            that.close(button.dataset.modalAction);
                            return;
                        }

                        if (that.progressClick) {
                            promise = that.progressClick(button, promise);
                        }
                        promise.then(() => {
                            that.close(button.dataset.modalAction);
                        }).catch((error) => {
                            if (that.reject) {
                                that.reject(error);
                            }
                        });
                    } else {
                        that.close(button.dataset.modalAction);
                    }

                };
            }
        }
    }

    show(handler) {
        let that = this;
        that.handler = handler;

        return new Promise((resolve, reject) => {
            that.resolve = resolve;
            that.reject = reject;
            that.container.style.display = 'flex';
        });
    }

    close(action) {
        this.container.style.display = 'none';
        if (this.resolve) {
            this.resolve(action);
        }
    }
};

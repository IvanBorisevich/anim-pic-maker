class TimeBox {
    static SelectionIntervals = new Map([
        ['HOURS', { start: 0, end: 2, min: 0, max: 24, step: 1, len: 2 }],
        ['MINUTES', { start: 3, end: 5, min: 0, max: 60, step: 1, len: 2 }],
        ['SECONDS', { start: 6, end: 8, min: 0, max: 60, step: 1, len: 2 }],
        ['MILLIS', { start: 9, end: 12, min: 0, max: 1000, step: 1, len: 3 }]
    ]);
    static ChangeModes = {
        INCREMENT: 'increment',
        DECREMENT: 'decrement'
    };

    constructor(element, readonly = false) {
        this.hours = 0;
        this.minutes = 0;
        this.seconds = 0;
        this.millis = 0;
        this.currentSelectionInterval = ['SECONDS', TimeBox.SelectionIntervals.get('SECONDS')];
        this.enteredText = '';

        var copyThis = this;
        this.timeBox = element;
        this.textBox = this.timeBox.find('input[type="text"]');
        this.textBox.val('00:00:00.000');
        this.btnUp = this.timeBox.find('.timebox-up');
        this.btnDown = this.timeBox.find('.timebox-down');

        if (!readonly) {
            this.timeBox.focusout(function() {
                copyThis.onBtnLeave(copyThis.btnUp);
                copyThis.onBtnLeave(copyThis.btnDown);
                copyThis.refreshUI();
            });
            this.textBox.click(function() {
                copyThis.onTextBoxClick();
            });
            this.textBox.change(function(event) {
                event.target.focus();
                event.target.setSelectionRange(
                    copyThis.currentSelectionInterval[1].start,
                    copyThis.currentSelectionInterval[1].end
                );
                copyThis.callOnTimeValueChangeCallback(copyThis.getTimeMillis() / 1000);
            });
            this.textBox.focus(function() {
                copyThis.setInputSelection();
            });
            this.textBox.on('keydown paste', function(event) {
                if (copyThis.textBox.is(":focus")) {
                    copyThis.onTextBoxKeyPressed(event);
                }
            });
            this.btnUp.click(function() {
                copyThis.onBtnUpClick();
                copyThis.setInputSelection();
            });
            this.btnUp.mousedown(function(e) {
                e.preventDefault();
            });
            this.btnUp.mouseup(function() {
                copyThis.onBtnLeave($(this));
            });
            this.btnDown.click(function() {
                copyThis.onBtnDownClick();
                copyThis.setInputSelection();
            });
            this.btnDown.mousedown(function(e) {
                e.preventDefault();
            });
            this.btnDown.mouseup(function() {
                copyThis.onBtnLeave($(this));
            });
        } else {
            this.textBox.prop('disabled', true);
        }
    }

    setOnTimeValueChangeCallback(callback, context) {
        this.onTimeValueChangeCallback = callback;
        this.onTimeValueChangeCallbackContext = context;
    }

    callOnTimeValueChangeCallback(newTimeValue) {
        this.onTimeValueChangeCallback.call(this.onTimeValueChangeCallbackContext, newTimeValue);
    }

    setTimeMillis(millis) {
        var formatted = this.millisToTime(millis);
        this.textBox.val(formatted);
    }

    getTimeMillis() {
        return this.hours * 60 * 60 * 1000 + this.minutes * 60 * 1000 + this.seconds * 1000 + this.millis;
    }

    millisToTime(s) {
        s = Math.round(s);

        function pad(n, z) {
            z = z || 2;
            return ('00' + n).slice(-z);
        }

        var ms = s % 1000;
        s = (s - ms) / 1000;
        var secs = s % 60;
        s = (s - secs) / 60;
        var mins = s % 60;
        var hrs = (s - mins) / 60;

        this.hours = hrs;
        this.minutes = mins;
        this.seconds = secs;
        this.millis = ms;

        return pad(hrs) + ':' + pad(mins) + ':' + pad(secs) + '.' + pad(ms, 3);
    }

    onTextBoxClick() {
        var currentCaretPos = this.textBox[0].selectionStart;
        var currentSelectionInterval = this.getSelectionIntervalByCurrentCaretPos(currentCaretPos);
        if (currentSelectionInterval != null) {
            this.currentSelectionInterval = currentSelectionInterval;
            this.setInputSelection();
        }
    }

    getSelectionIntervalByCurrentCaretPos(currentCaretPos) {
        for (const [key, value] of TimeBox.SelectionIntervals.entries()) {
            if (currentCaretPos >= value.start && currentCaretPos <= value.end) {
                return [key, value];
            }
        }
        return null;
    }

    setInputSelection() {
        this.textBox.trigger("change");
    }

    getValueInCurrentSelectionInterval() {
        var result = null;
        switch (this.currentSelectionInterval[0]) {
            case 'MILLIS':
                result = this.millis;
                break;
            case 'SECONDS':
                result = this.seconds;
                break;
            case 'MINUTES':
                result = this.minutes;
                break;
            case 'HOURS':
                result = this.hours;
                break;
            default:
                break;
        }
        return result;
    }

    onBtnUpClick() {
        this.setClickedButtonCSS(this.btnUp);
        this.onBtnLeave(this.btnDown);
        this.refreshAllCurrentValues(TimeBox.ChangeModes.INCREMENT);
        this.refreshUI();
    }

    onBtnDownClick() {
        this.setClickedButtonCSS(this.btnDown);
        this.onBtnLeave(this.btnUp);
        this.refreshAllCurrentValues(TimeBox.ChangeModes.DECREMENT);
        this.refreshUI();
    }

    onTextBoxKeyPressed(e) {
        var keyCode = e.keyCode || e.which;

        if (keyCode == 39) { // arrow RIGHT
            e.preventDefault();
            this.refreshUI();
            switch (this.currentSelectionInterval[0]) {
                case 'MILLIS':
                    this.currentSelectionInterval = ['HOURS', TimeBox.SelectionIntervals.get('HOURS')];
                    break;
                case 'SECONDS':
                    this.currentSelectionInterval = ['MILLIS', TimeBox.SelectionIntervals.get('MILLIS')];
                    break;
                case 'MINUTES':
                    this.currentSelectionInterval = ['SECONDS', TimeBox.SelectionIntervals.get('SECONDS')];
                    break;
                case 'HOURS':
                    this.currentSelectionInterval = ['MINUTES', TimeBox.SelectionIntervals.get('MINUTES')];
                    break;
                default:
                    break;
            }
            this.setInputSelection();
        }
        if (keyCode == 37) { // arrow LEFT
            e.preventDefault();
            this.refreshUI();
            switch (this.currentSelectionInterval[0]) {
                case 'MILLIS':
                    this.currentSelectionInterval = ['SECONDS', TimeBox.SelectionIntervals.get('SECONDS')];
                    break;
                case 'SECONDS':
                    this.currentSelectionInterval = ['MINUTES', TimeBox.SelectionIntervals.get('MINUTES')];
                    break;
                case 'MINUTES':
                    this.currentSelectionInterval = ['HOURS', TimeBox.SelectionIntervals.get('HOURS')];
                    break;
                case 'HOURS':
                    this.currentSelectionInterval = ['MILLIS', TimeBox.SelectionIntervals.get('MILLIS')];
                    break;
                default:
                    break;
            }
            this.setInputSelection();
        }
        if (keyCode >= 48 && keyCode <= 57) { // digits 0-9
            var enteredDigit = String.fromCharCode(keyCode);
            this.enteredText += enteredDigit + '';
            if (this.enteredText >= this.currentSelectionInterval[1].max ||
                this.enteredText.length > 2) {
                e.preventDefault();
            } else {
                this.refreshCurrentValueByEnteredText();
            }
        } else {
            this.enteredText = '';
        }
        if (keyCode == 38) { // arrow UP
            e.preventDefault();
            this.btnUp.trigger("click");
        }
        if (keyCode == 40) { // arrow DOWN
            e.preventDefault();
            this.btnDown.trigger("click");
        }

        if (![116, 117].includes(keyCode)) {
            var oneDigitRegex = /^\d$/;
            if ([8, 46].includes(keyCode) ||
                !oneDigitRegex.test(String.fromCharCode(keyCode))) {
                e.preventDefault();
            }
        }
    }

    refreshAllCurrentValues(changeMode) {
        switch (this.currentSelectionInterval[0]) {
            case 'MILLIS':
                var changeResult = this.changeValueByIntervalKey(this.millis, 'MILLIS', changeMode);
                this.millis = changeResult.newValue;
                if (!changeResult.needToChangeLeftValue) {
                    break;
                }
            case 'SECONDS':
                var changeResult = this.changeValueByIntervalKey(this.seconds, 'SECONDS', changeMode);
                this.seconds = changeResult.newValue;
                if (!changeResult.needToChangeLeftValue) {
                    break;
                }
            case 'MINUTES':
                var changeResult = this.changeValueByIntervalKey(this.minutes, 'MINUTES', changeMode);
                this.minutes = changeResult.newValue;
                if (!changeResult.needToChangeLeftValue) {
                    break;
                }
            case 'HOURS':
                var changeResult = this.changeValueByIntervalKey(this.hours, 'HOURS', changeMode);
                this.hours = changeResult.newValue;
                break;
            default:
                break;
        }
    }

    refreshCurrentValueByEnteredText() {
        switch (this.currentSelectionInterval[0]) {
            case 'MILLIS':
                this.millis = parseInt(this.enteredText);
                break;
            case 'SECONDS':
                this.seconds = parseInt(this.enteredText);
                break;
            case 'MINUTES':
                this.minutes = parseInt(this.enteredText);
                break;
            case 'HOURS':
                this.hours = parseInt(this.enteredText);
                break;
            default:
                break;
        }
    }

    refreshUI() {
        this.textBox.val(this.leadZeros(this.hours, 2) + ':' +
            this.leadZeros(this.minutes, 2) + ':' +
            this.leadZeros(this.seconds, 2) + '.' +
            this.leadZeros(this.millis, 3));
    }

    changeValueByIntervalKey(initialValue, intervalKey, changeMode) {
        var interval = TimeBox.SelectionIntervals.get(intervalKey);
        var delta = interval.step;
        if (changeMode == TimeBox.ChangeModes.DECREMENT) {
            delta = -delta;
        }

        var newValue = initialValue + delta;

        var needToChangeLeftValue = false;
        if (newValue < 0) {
            needToChangeLeftValue = true;
            newValue += interval.max;
        }

        if (Math.trunc(newValue / interval.max) > 0) {
            needToChangeLeftValue = true;
        }

        newValue %= interval.max;

        return {
            newValue: newValue,
            needToChangeLeftValue: needToChangeLeftValue
        }
    }

    leadZeros(num, size) {
        num = num.toString();
        while (num.length < size) num = "0" + num;
        return num;
    }

    onBtnLeave(btn) {
        this.setLeftButtonCSS(btn);
    }

    setLeftButtonCSS(btn) {
        btn.attr('style', 'background-color: transparent !important;');
        btn.find('a').attr('style', 'color: #cfcdc7 !important;');
    }

    setClickedButtonCSS(btn) {
        btn.attr('style', 'background-color: rgb(207, 205, 199, 0.5) !important;');
        btn.find('a').attr('style', 'color: #5256ad !important;');
    }
}
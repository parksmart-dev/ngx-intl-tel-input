import * as lpn from 'google-libphonenumber';
import { Component, EventEmitter, forwardRef, Input, Output, ViewChild, } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { setTheme } from 'ngx-bootstrap/utils';
import { CountryCode } from './data/country-code';
import { SearchCountryField } from './enums/search-country-field.enum';
import { phoneNumberValidator } from './ngx-intl-tel-input.validator';
import { PhoneNumberFormat } from './enums/phone-number-format.enum';
import * as i0 from "@angular/core";
import * as i1 from "./data/country-code";
import * as i2 from "@angular/common";
import * as i3 from "ngx-bootstrap/dropdown";
import * as i4 from "@angular/forms";
import * as i5 from "./directives/native-element-injector.directive";
export class NgxIntlTelInputComponent {
    constructor(countryCodeData) {
        this.countryCodeData = countryCodeData;
        this.value = '';
        this.preferredCountries = [];
        this.enablePlaceholder = true;
        this.numberFormat = PhoneNumberFormat.International;
        this.cssClass = 'form-control';
        this.onlyCountries = [];
        this.enableAutoCountrySelect = true;
        this.searchCountryFlag = false;
        this.searchCountryField = [SearchCountryField.All];
        this.searchCountryPlaceholder = 'Search Country';
        this.maxLength = '';
        this.selectFirstCountry = true;
        this.phoneValidation = true;
        this.inputId = 'phone';
        this.separateDialCode = false;
        this.countryChange = new EventEmitter();
        this.selectedCountry = {
            areaCodes: undefined,
            dialCode: '',
            htmlId: '',
            flagClass: '',
            iso2: '',
            name: '',
            placeHolder: '',
            priority: 0,
        };
        this.phoneNumber = '';
        this.allCountries = [];
        this.preferredCountriesInDropDown = [];
        // Has to be 'any' to prevent a need to install @types/google-libphonenumber by the package user...
        this.phoneUtil = lpn.PhoneNumberUtil.getInstance();
        this.disabled = false;
        this.errors = ['Phone number is required.'];
        this.countrySearchText = '';
        this.onTouched = () => { };
        this.propagateChange = (_) => { };
        // If this is not set, ngx-bootstrap will try to use the bs3 CSS (which is not what we've embedded) and will
        // Add the wrong classes and such
        setTheme('bs4');
    }
    ngOnInit() {
        this.init();
    }
    ngOnChanges(changes) {
        const selectedISO = changes['selectedCountryISO'];
        if (this.allCountries &&
            selectedISO &&
            selectedISO.currentValue !== selectedISO.previousValue) {
            this.updateSelectedCountry();
        }
        if (changes.preferredCountries) {
            this.updatePreferredCountries();
        }
        this.checkSeparateDialCodeStyle();
    }
    /*
        This is a wrapper method to avoid calling this.ngOnInit() in writeValue().
        Ref: http://codelyzer.com/rules/no-life-cycle-call/
    */
    init() {
        this.fetchCountryData();
        if (this.preferredCountries.length) {
            this.updatePreferredCountries();
        }
        if (this.onlyCountries.length) {
            this.allCountries = this.allCountries.filter((c) => this.onlyCountries.includes(c.iso2));
        }
        if (this.selectFirstCountry) {
            if (this.preferredCountriesInDropDown.length) {
                this.setSelectedCountry(this.preferredCountriesInDropDown[0]);
            }
            else {
                this.setSelectedCountry(this.allCountries[0]);
            }
        }
        this.updateSelectedCountry();
        this.checkSeparateDialCodeStyle();
    }
    setSelectedCountry(country) {
        this.selectedCountry = country;
        this.countryChange.emit(country);
    }
    /**
     * Search country based on country name, iso2, dialCode or all of them.
     */
    searchCountry() {
        if (!this.countrySearchText) {
            this.countryList.nativeElement
                .querySelector('.iti__country-list li')
                .scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest',
            });
            return;
        }
        const countrySearchTextLower = this.countrySearchText.toLowerCase();
        const country = this.allCountries.filter((c) => {
            if (this.searchCountryField.indexOf(SearchCountryField.All) > -1) {
                // Search in all fields
                if (c.iso2.toLowerCase().startsWith(countrySearchTextLower)) {
                    return c;
                }
                if (c.name.toLowerCase().startsWith(countrySearchTextLower)) {
                    return c;
                }
                if (c.dialCode.startsWith(this.countrySearchText)) {
                    return c;
                }
            }
            else {
                // Or search by specific SearchCountryField(s)
                if (this.searchCountryField.indexOf(SearchCountryField.Iso2) > -1) {
                    if (c.iso2.toLowerCase().startsWith(countrySearchTextLower)) {
                        return c;
                    }
                }
                if (this.searchCountryField.indexOf(SearchCountryField.Name) > -1) {
                    if (c.name.toLowerCase().startsWith(countrySearchTextLower)) {
                        return c;
                    }
                }
                if (this.searchCountryField.indexOf(SearchCountryField.DialCode) > -1) {
                    if (c.dialCode.startsWith(this.countrySearchText)) {
                        return c;
                    }
                }
            }
        });
        if (country.length > 0) {
            const el = this.countryList.nativeElement.querySelector('#' + country[0].htmlId);
            if (el) {
                el.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'nearest',
                });
            }
        }
        this.checkSeparateDialCodeStyle();
    }
    onPhoneNumberChange() {
        let countryCode;
        // Handle the case where the user sets the value programatically based on a persisted ChangeData obj.
        if (this.phoneNumber && typeof this.phoneNumber === 'object') {
            const numberObj = this.phoneNumber;
            this.phoneNumber = numberObj.number;
            countryCode = numberObj.countryCode;
        }
        this.value = this.phoneNumber;
        countryCode = countryCode || this.selectedCountry.iso2;
        const number = this.getParsedNumber(this.phoneNumber, countryCode);
        // auto select country based on the extension (and areaCode if needed) (e.g select Canada if number starts with +1 416)
        if (this.enableAutoCountrySelect) {
            countryCode =
                number && number.getCountryCode()
                    ? this.getCountryIsoCode(number.getCountryCode(), number)
                    : this.selectedCountry.iso2;
            if (countryCode && countryCode !== this.selectedCountry.iso2) {
                const newCountry = this.allCountries
                    .sort((a, b) => {
                    return a.priority - b.priority;
                })
                    .find((c) => c.iso2 === countryCode);
                if (newCountry) {
                    this.selectedCountry = newCountry;
                }
            }
        }
        countryCode = countryCode ? countryCode : this.selectedCountry.iso2;
        this.checkSeparateDialCodeStyle();
        if (!this.value) {
            // Reason: avoid https://stackoverflow.com/a/54358133/1617590
            // tslint:disable-next-line: no-null-keyword
            this.propagateChange(null);
        }
        else {
            const intlNo = number
                ? this.phoneUtil.format(number, lpn.PhoneNumberFormat.INTERNATIONAL)
                : '';
            // parse phoneNumber if separate dial code is needed
            if (this.separateDialCode && intlNo) {
                this.value = this.removeDialCode(intlNo);
            }
            this.propagateChange({
                number: this.value,
                internationalNumber: intlNo,
                nationalNumber: number
                    ? this.phoneUtil.format(number, lpn.PhoneNumberFormat.NATIONAL)
                    : '',
                e164Number: number
                    ? this.phoneUtil.format(number, lpn.PhoneNumberFormat.E164)
                    : '',
                countryCode: countryCode.toUpperCase(),
                dialCode: '+' + this.selectedCountry.dialCode,
            });
        }
    }
    onCountrySelect(country, el) {
        this.setSelectedCountry(country);
        this.checkSeparateDialCodeStyle();
        if (this.phoneNumber && this.phoneNumber.length > 0) {
            this.value = this.phoneNumber;
            const number = this.getParsedNumber(this.phoneNumber, this.selectedCountry.iso2);
            const intlNo = number
                ? this.phoneUtil.format(number, lpn.PhoneNumberFormat.INTERNATIONAL)
                : '';
            // parse phoneNumber if separate dial code is needed
            if (this.separateDialCode && intlNo) {
                this.value = this.removeDialCode(intlNo);
            }
            this.propagateChange({
                number: this.value,
                internationalNumber: intlNo,
                nationalNumber: number
                    ? this.phoneUtil.format(number, lpn.PhoneNumberFormat.NATIONAL)
                    : '',
                e164Number: number
                    ? this.phoneUtil.format(number, lpn.PhoneNumberFormat.E164)
                    : '',
                countryCode: this.selectedCountry.iso2.toUpperCase(),
                dialCode: '+' + this.selectedCountry.dialCode,
            });
        }
        else {
            // Reason: avoid https://stackoverflow.com/a/54358133/1617590
            // tslint:disable-next-line: no-null-keyword
            this.propagateChange(null);
        }
        el.focus();
    }
    onInputKeyPress(event) {
        const allowedChars = /[0-9\+\-\(\)\ ]/;
        const allowedCtrlChars = /[axcv]/; // Allows copy-pasting
        const allowedOtherKeys = [
            'ArrowLeft',
            'ArrowUp',
            'ArrowRight',
            'ArrowDown',
            'Home',
            'End',
            'Insert',
            'Delete',
            'Backspace',
        ];
        if (!allowedChars.test(event.key) &&
            !(event.ctrlKey && allowedCtrlChars.test(event.key)) &&
            !allowedOtherKeys.includes(event.key)) {
            event.preventDefault();
        }
    }
    registerOnChange(fn) {
        this.propagateChange = fn;
    }
    registerOnTouched(fn) {
        this.onTouched = fn;
    }
    setDisabledState(isDisabled) {
        this.disabled = isDisabled;
    }
    writeValue(obj) {
        if (obj === undefined) {
            this.init();
        }
        this.phoneNumber = obj;
        setTimeout(() => {
            this.onPhoneNumberChange();
        }, 1);
    }
    resolvePlaceholder() {
        let placeholder = '';
        if (this.customPlaceholder) {
            placeholder = this.customPlaceholder;
        }
        else if (this.selectedCountry.placeHolder) {
            placeholder = this.selectedCountry.placeHolder;
            if (this.separateDialCode) {
                placeholder = this.removeDialCode(placeholder);
            }
        }
        return placeholder;
    }
    /* --------------------------------- Helpers -------------------------------- */
    /**
     * Returns parse PhoneNumber object.
     * @param phoneNumber string
     * @param countryCode string
     */
    getParsedNumber(phoneNumber, countryCode) {
        let number;
        try {
            number = this.phoneUtil.parse(phoneNumber, countryCode.toUpperCase());
        }
        catch (e) { }
        return number;
    }
    /**
     * Adjusts input alignment based on the dial code presentation style.
     */
    checkSeparateDialCodeStyle() {
        if (this.separateDialCode && this.selectedCountry) {
            const cntryCd = this.selectedCountry.dialCode;
            this.separateDialCodeClass =
                'separate-dial-code iti-sdc-' + (cntryCd.length + 1);
        }
        else {
            this.separateDialCodeClass = '';
        }
    }
    /**
     * Cleans dialcode from phone number string.
     * @param phoneNumber string
     */
    removeDialCode(phoneNumber) {
        const number = this.getParsedNumber(phoneNumber, this.selectedCountry.iso2);
        phoneNumber = this.phoneUtil.format(number, lpn.PhoneNumberFormat[this.numberFormat]);
        if (phoneNumber.startsWith('+') && this.separateDialCode) {
            phoneNumber = phoneNumber.substr(phoneNumber.indexOf(' ') + 1);
        }
        return phoneNumber;
    }
    /**
     * Sifts through all countries and returns iso code of the primary country
     * based on the number provided.
     * @param countryCode country code in number format
     * @param number PhoneNumber object
     */
    getCountryIsoCode(countryCode, number) {
        // Will use this to match area code from the first numbers
        const rawNumber = number['values_']['2'].toString();
        // List of all countries with countryCode (can be more than one. e.x. US, CA, DO, PR all have +1 countryCode)
        const countries = this.allCountries.filter((c) => c.dialCode === countryCode.toString());
        // Main country is the country, which has no areaCodes specified in country-code.ts file.
        const mainCountry = countries.find((c) => c.areaCodes === undefined);
        // Secondary countries are all countries, which have areaCodes specified in country-code.ts file.
        const secondaryCountries = countries.filter((c) => c.areaCodes !== undefined);
        let matchedCountry = mainCountry ? mainCountry.iso2 : undefined;
        /*
            Iterate over each secondary country and check if nationalNumber starts with any of areaCodes available.
            If no matches found, fallback to the main country.
        */
        secondaryCountries.forEach((country) => {
            country.areaCodes.forEach((areaCode) => {
                if (rawNumber.startsWith(areaCode)) {
                    matchedCountry = country.iso2;
                }
            });
        });
        return matchedCountry;
    }
    /**
     * Gets formatted example phone number from phoneUtil.
     * @param countryCode string
     */
    getPhoneNumberPlaceHolder(countryCode) {
        try {
            return this.phoneUtil.format(this.phoneUtil.getExampleNumber(countryCode), lpn.PhoneNumberFormat[this.numberFormat]);
        }
        catch (e) {
            return e;
        }
    }
    /**
     * Clearing the list to avoid duplicates (https://github.com/webcat12345/ngx-intl-tel-input/issues/248)
     */
    fetchCountryData() {
        this.allCountries = [];
        this.countryCodeData.allCountries.forEach((c) => {
            const country = {
                name: c[0].toString(),
                iso2: c[1].toString(),
                dialCode: c[2].toString(),
                priority: +c[3] || 0,
                areaCodes: c[4] || undefined,
                htmlId: `iti-0__item-${c[1].toString()}`,
                flagClass: `iti__${c[1].toString().toLocaleLowerCase()}`,
                placeHolder: '',
            };
            if (this.enablePlaceholder) {
                country.placeHolder = this.getPhoneNumberPlaceHolder(country.iso2.toUpperCase());
            }
            this.allCountries.push(country);
        });
    }
    /**
     * Populates preferredCountriesInDropDown with prefferred countries.
     */
    updatePreferredCountries() {
        if (this.preferredCountries.length) {
            this.preferredCountriesInDropDown = [];
            this.preferredCountries.forEach((iso2) => {
                const preferredCountry = this.allCountries.filter((c) => {
                    return c.iso2 === iso2;
                });
                this.preferredCountriesInDropDown.push(preferredCountry[0]);
            });
        }
    }
    /**
     * Updates selectedCountry.
     */
    updateSelectedCountry() {
        if (this.selectedCountryISO) {
            this.selectedCountry = this.allCountries.find((c) => {
                return c.iso2.toLowerCase() === this.selectedCountryISO.toLowerCase();
            });
            if (this.selectedCountry) {
                if (this.phoneNumber) {
                    this.onPhoneNumberChange();
                }
                else {
                    // Reason: avoid https://stackoverflow.com/a/54358133/1617590
                    // tslint:disable-next-line: no-null-keyword
                    this.propagateChange(null);
                }
            }
        }
    }
}
NgxIntlTelInputComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: NgxIntlTelInputComponent, deps: [{ token: i1.CountryCode }], target: i0.ɵɵFactoryTarget.Component });
NgxIntlTelInputComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.1.0", type: NgxIntlTelInputComponent, selector: "ngx-intl-tel-input", inputs: { value: "value", preferredCountries: "preferredCountries", enablePlaceholder: "enablePlaceholder", customPlaceholder: "customPlaceholder", numberFormat: "numberFormat", cssClass: "cssClass", onlyCountries: "onlyCountries", enableAutoCountrySelect: "enableAutoCountrySelect", searchCountryFlag: "searchCountryFlag", searchCountryField: "searchCountryField", searchCountryPlaceholder: "searchCountryPlaceholder", maxLength: "maxLength", selectFirstCountry: "selectFirstCountry", selectedCountryISO: "selectedCountryISO", phoneValidation: "phoneValidation", inputId: "inputId", separateDialCode: "separateDialCode" }, outputs: { countryChange: "countryChange" }, providers: [
        CountryCode,
        {
            provide: NG_VALUE_ACCESSOR,
            // tslint:disable-next-line:no-forward-ref
            useExisting: forwardRef(() => NgxIntlTelInputComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useValue: phoneNumberValidator,
            multi: true,
        },
    ], viewQueries: [{ propertyName: "countryList", first: true, predicate: ["countryList"], descendants: true }], usesOnChanges: true, ngImport: i0, template: "<div class=\"iti iti--allow-dropdown\"\n\t[ngClass]=\"separateDialCodeClass\">\n\t<div class=\"iti__flag-container\"\n\t\tdropdown\n\t\t[ngClass]=\"{'disabled': disabled}\"\n\t\t[isDisabled]=\"disabled\">\n\t\t<div class=\"iti__selected-flag dropdown-toggle\"\n\t\t\tdropdownToggle>\n\t\t\t<div class=\"iti__flag\"\n\t\t\t\t[ngClass]=\"selectedCountry?.flagClass\"></div>\n\t\t\t<div *ngIf=\"separateDialCode\"\n\t\t\t\tclass=\"selected-dial-code\">+{{selectedCountry.dialCode}}</div>\n\t\t\t<div class=\"iti__arrow\"></div>\n\t\t</div>\n\t\t<div *dropdownMenu\n\t\t\tclass=\"dropdown-menu country-dropdown\">\n\t\t\t<div class=\"search-container\"\n\t\t\t\t*ngIf=\"searchCountryFlag && searchCountryField\">\n\t\t\t\t<input id=\"country-search-box\"\n\t\t\t\t\t[(ngModel)]=\"countrySearchText\"\n\t\t\t\t\t(keyup)=\"searchCountry()\"\n\t\t\t\t\t(click)=\"$event.stopPropagation()\"\n\t\t\t\t\t[placeholder]=\"searchCountryPlaceholder\"\n\t\t\t\t\tautofocus>\n\t\t\t</div>\n\t\t\t<ul class=\"iti__country-list\"\n\t\t\t\t#countryList>\n\t\t\t\t<li class=\"iti__country iti__preferred\"\n\t\t\t\t\t*ngFor=\"let country of preferredCountriesInDropDown\"\n\t\t\t\t\t(click)=\"onCountrySelect(country, focusable)\"\n\t\t\t\t\t[id]=\"country.htmlId+'-preferred'\">\n\t\t\t\t\t<div class=\"iti__flag-box\">\n\t\t\t\t\t\t<div class=\"iti__flag\"\n\t\t\t\t\t\t\t[ngClass]=\"country.flagClass\"></div>\n\t\t\t\t\t</div>\n\t\t\t\t\t<span class=\"iti__country-name\">{{country.name}}</span>\n\t\t\t\t\t<span class=\"iti__dial-code\">+{{country.dialCode}}</span>\n\t\t\t\t</li>\n\t\t\t\t<li class=\"iti__divider\"\n\t\t\t\t\t*ngIf=\"preferredCountriesInDropDown?.length\"></li>\n\t\t\t\t<li class=\"iti__country iti__standard\"\n\t\t\t\t\t*ngFor=\"let country of allCountries\"\n\t\t\t\t\t(click)=\"onCountrySelect(country, focusable)\"\n\t\t\t\t\t[id]=\"country.htmlId\">\n\t\t\t\t\t<div class=\"iti__flag-box\">\n\t\t\t\t\t\t<div class=\"iti__flag\"\n\t\t\t\t\t\t\t[ngClass]=\"country.flagClass\"></div>\n\t\t\t\t\t</div>\n\t\t\t\t\t<span class=\"iti__country-name\">{{country.name}}</span>\n\t\t\t\t\t<span class=\"iti__dial-code\">+{{country.dialCode}}</span>\n\t\t\t\t</li>\n\t\t\t</ul>\n\t\t</div>\n\t</div>\n\t<input type=\"tel\"\n\t\t[id]=\"inputId\"\n\t\tautocomplete=\"off\"\n\t\t[ngClass]=\"cssClass\"\n\t\t(blur)=\"onTouched()\"\n\t\t(keypress)=\"onInputKeyPress($event)\"\n\t\t[(ngModel)]=\"phoneNumber\"\n\t\t(ngModelChange)=\"onPhoneNumberChange()\"\n\t\t[disabled]=\"disabled\"\n\t\t[placeholder]=\"resolvePlaceholder()\"\n\t\t[attr.maxLength]=\"maxLength\"\n\t\t[attr.validation]=\"phoneValidation\"\n\t\t#focusable>\n</div>\n", styles: [".dropup,.dropright,.dropdown,.dropleft{position:relative}.dropdown-toggle{white-space:nowrap}.dropdown-toggle:after{display:inline-block;margin-left:.255em;vertical-align:.255em;content:\"\";border-top:.3em solid;border-right:.3em solid transparent;border-bottom:0;border-left:.3em solid transparent}.dropdown-toggle:empty:after{margin-left:0}.dropdown-menu{position:absolute;top:100%;left:0;z-index:1000;display:none;float:left;min-width:10rem;padding:.5rem 0;margin:.125rem 0 0;font-size:1rem;color:#212529;text-align:left;list-style:none;background-color:#fff;background-clip:padding-box;border:1px solid rgba(0,0,0,.15);border-radius:.25rem}.dropdown-menu-left{right:auto;left:0}.dropdown-menu-right{right:0;left:auto}@media (min-width: 576px){.dropdown-menu-sm-left{right:auto;left:0}.dropdown-menu-sm-right{right:0;left:auto}}@media (min-width: 768px){.dropdown-menu-md-left{right:auto;left:0}.dropdown-menu-md-right{right:0;left:auto}}@media (min-width: 992px){.dropdown-menu-lg-left{right:auto;left:0}.dropdown-menu-lg-right{right:0;left:auto}}@media (min-width: 1200px){.dropdown-menu-xl-left{right:auto;left:0}.dropdown-menu-xl-right{right:0;left:auto}}.dropup .dropdown-menu{top:auto;bottom:100%;margin-top:0;margin-bottom:.125rem}.dropup .dropdown-toggle:after{display:inline-block;margin-left:.255em;vertical-align:.255em;content:\"\";border-top:0;border-right:.3em solid transparent;border-bottom:.3em solid;border-left:.3em solid transparent}.dropup .dropdown-toggle:empty:after{margin-left:0}.dropright .dropdown-menu{top:0;right:auto;left:100%;margin-top:0;margin-left:.125rem}.dropright .dropdown-toggle:after{display:inline-block;margin-left:.255em;vertical-align:.255em;content:\"\";border-top:.3em solid transparent;border-right:0;border-bottom:.3em solid transparent;border-left:.3em solid}.dropright .dropdown-toggle:empty:after{margin-left:0}.dropright .dropdown-toggle:after{vertical-align:0}.dropleft .dropdown-menu{top:0;right:100%;left:auto;margin-top:0;margin-right:.125rem}.dropleft .dropdown-toggle:after{display:inline-block;margin-left:.255em;vertical-align:.255em;content:\"\"}.dropleft .dropdown-toggle:after{display:none}.dropleft .dropdown-toggle:before{display:inline-block;margin-right:.255em;vertical-align:.255em;content:\"\";border-top:.3em solid transparent;border-right:.3em solid;border-bottom:.3em solid transparent}.dropleft .dropdown-toggle:empty:after{margin-left:0}.dropleft .dropdown-toggle:before{vertical-align:0}.dropdown-menu[x-placement^=top],.dropdown-menu[x-placement^=right],.dropdown-menu[x-placement^=bottom],.dropdown-menu[x-placement^=left]{right:auto;bottom:auto}.dropdown-divider{height:0;margin:.5rem 0;overflow:hidden;border-top:1px solid #e9ecef}.dropdown-item{display:block;width:100%;padding:.25rem 1.5rem;clear:both;font-weight:400;color:#212529;text-align:inherit;white-space:nowrap;background-color:transparent;border:0}.dropdown-item:hover,.dropdown-item:focus{color:#16181b;text-decoration:none;background-color:#f8f9fa}.dropdown-item.active,.dropdown-item:active{color:#fff;text-decoration:none;background-color:#007bff}.dropdown-item.disabled,.dropdown-item:disabled{color:#6c757d;pointer-events:none;background-color:transparent}.dropdown-menu.show{display:block}.dropdown-header{display:block;padding:.5rem 1.5rem;margin-bottom:0;font-size:.875rem;color:#6c757d;white-space:nowrap}.dropdown-item-text{display:block;padding:.25rem 1.5rem;color:#212529}\n", "li.iti__country:hover{background-color:#0000000d}.iti__selected-flag.dropdown-toggle:after{content:none}.iti__flag-container.disabled{cursor:default!important}.iti.iti--allow-dropdown .flag-container.disabled:hover .iti__selected-flag{background:none}.country-dropdown{border:1px solid #ccc;width:-webkit-fit-content;width:-moz-fit-content;width:fit-content;padding:1px;border-collapse:collapse}.search-container{position:relative}.search-container input{width:100%;border:none;border-bottom:1px solid #ccc;padding-left:10px}.search-icon{position:absolute;z-index:2;width:25px;margin:1px 10px}.iti__country-list{position:relative;border:none}.iti input#country-search-box{padding-left:6px}.iti .selected-dial-code{margin-left:6px}.iti.separate-dial-code .iti__selected-flag,.iti.separate-dial-code.iti--allow-dropdown.iti-sdc-2 .iti__selected-flag,.iti.separate-dial-code.iti--allow-dropdown.iti-sdc-3 .iti__selected-flag,.iti.separate-dial-code.iti--allow-dropdown.iti-sdc-4 .iti__selected-flag{width:93px}.iti.separate-dial-code input,.iti.separate-dial-code.iti--allow-dropdown.iti-sdc-2 input,.iti.separate-dial-code.iti--allow-dropdown.iti-sdc-3 input,.iti.separate-dial-code.iti--allow-dropdown.iti-sdc-4 input{padding-left:98px}\n"], directives: [{ type: i2.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }, { type: i3.BsDropdownDirective, selector: "[bsDropdown],[dropdown]", inputs: ["autoClose", "isAnimated", "insideClick", "isDisabled", "isOpen", "placement", "triggers", "container", "dropup"], outputs: ["onShown", "onHidden", "isOpenChange"], exportAs: ["bs-dropdown"] }, { type: i3.BsDropdownToggleDirective, selector: "[bsDropdownToggle],[dropdownToggle]", exportAs: ["bs-dropdown-toggle"] }, { type: i2.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i3.BsDropdownMenuDirective, selector: "[bsDropdownMenu],[dropdownMenu]", exportAs: ["bs-dropdown-menu"] }, { type: i4.DefaultValueAccessor, selector: "input:not([type=checkbox])[formControlName],textarea[formControlName],input:not([type=checkbox])[formControl],textarea[formControl],input:not([type=checkbox])[ngModel],textarea[ngModel],[ngDefaultControl]" }, { type: i4.NgControlStatus, selector: "[formControlName],[ngModel],[formControl]" }, { type: i4.NgModel, selector: "[ngModel]:not([formControlName]):not([formControl])", inputs: ["name", "disabled", "ngModel", "ngModelOptions"], outputs: ["ngModelChange"], exportAs: ["ngModel"] }, { type: i5.NativeElementInjectorDirective, selector: "[ngModel], [formControl], [formControlName]" }, { type: i2.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: NgxIntlTelInputComponent, decorators: [{
            type: Component,
            args: [{ selector: 'ngx-intl-tel-input', providers: [
                        CountryCode,
                        {
                            provide: NG_VALUE_ACCESSOR,
                            // tslint:disable-next-line:no-forward-ref
                            useExisting: forwardRef(() => NgxIntlTelInputComponent),
                            multi: true,
                        },
                        {
                            provide: NG_VALIDATORS,
                            useValue: phoneNumberValidator,
                            multi: true,
                        },
                    ], template: "<div class=\"iti iti--allow-dropdown\"\n\t[ngClass]=\"separateDialCodeClass\">\n\t<div class=\"iti__flag-container\"\n\t\tdropdown\n\t\t[ngClass]=\"{'disabled': disabled}\"\n\t\t[isDisabled]=\"disabled\">\n\t\t<div class=\"iti__selected-flag dropdown-toggle\"\n\t\t\tdropdownToggle>\n\t\t\t<div class=\"iti__flag\"\n\t\t\t\t[ngClass]=\"selectedCountry?.flagClass\"></div>\n\t\t\t<div *ngIf=\"separateDialCode\"\n\t\t\t\tclass=\"selected-dial-code\">+{{selectedCountry.dialCode}}</div>\n\t\t\t<div class=\"iti__arrow\"></div>\n\t\t</div>\n\t\t<div *dropdownMenu\n\t\t\tclass=\"dropdown-menu country-dropdown\">\n\t\t\t<div class=\"search-container\"\n\t\t\t\t*ngIf=\"searchCountryFlag && searchCountryField\">\n\t\t\t\t<input id=\"country-search-box\"\n\t\t\t\t\t[(ngModel)]=\"countrySearchText\"\n\t\t\t\t\t(keyup)=\"searchCountry()\"\n\t\t\t\t\t(click)=\"$event.stopPropagation()\"\n\t\t\t\t\t[placeholder]=\"searchCountryPlaceholder\"\n\t\t\t\t\tautofocus>\n\t\t\t</div>\n\t\t\t<ul class=\"iti__country-list\"\n\t\t\t\t#countryList>\n\t\t\t\t<li class=\"iti__country iti__preferred\"\n\t\t\t\t\t*ngFor=\"let country of preferredCountriesInDropDown\"\n\t\t\t\t\t(click)=\"onCountrySelect(country, focusable)\"\n\t\t\t\t\t[id]=\"country.htmlId+'-preferred'\">\n\t\t\t\t\t<div class=\"iti__flag-box\">\n\t\t\t\t\t\t<div class=\"iti__flag\"\n\t\t\t\t\t\t\t[ngClass]=\"country.flagClass\"></div>\n\t\t\t\t\t</div>\n\t\t\t\t\t<span class=\"iti__country-name\">{{country.name}}</span>\n\t\t\t\t\t<span class=\"iti__dial-code\">+{{country.dialCode}}</span>\n\t\t\t\t</li>\n\t\t\t\t<li class=\"iti__divider\"\n\t\t\t\t\t*ngIf=\"preferredCountriesInDropDown?.length\"></li>\n\t\t\t\t<li class=\"iti__country iti__standard\"\n\t\t\t\t\t*ngFor=\"let country of allCountries\"\n\t\t\t\t\t(click)=\"onCountrySelect(country, focusable)\"\n\t\t\t\t\t[id]=\"country.htmlId\">\n\t\t\t\t\t<div class=\"iti__flag-box\">\n\t\t\t\t\t\t<div class=\"iti__flag\"\n\t\t\t\t\t\t\t[ngClass]=\"country.flagClass\"></div>\n\t\t\t\t\t</div>\n\t\t\t\t\t<span class=\"iti__country-name\">{{country.name}}</span>\n\t\t\t\t\t<span class=\"iti__dial-code\">+{{country.dialCode}}</span>\n\t\t\t\t</li>\n\t\t\t</ul>\n\t\t</div>\n\t</div>\n\t<input type=\"tel\"\n\t\t[id]=\"inputId\"\n\t\tautocomplete=\"off\"\n\t\t[ngClass]=\"cssClass\"\n\t\t(blur)=\"onTouched()\"\n\t\t(keypress)=\"onInputKeyPress($event)\"\n\t\t[(ngModel)]=\"phoneNumber\"\n\t\t(ngModelChange)=\"onPhoneNumberChange()\"\n\t\t[disabled]=\"disabled\"\n\t\t[placeholder]=\"resolvePlaceholder()\"\n\t\t[attr.maxLength]=\"maxLength\"\n\t\t[attr.validation]=\"phoneValidation\"\n\t\t#focusable>\n</div>\n", styles: [".dropup,.dropright,.dropdown,.dropleft{position:relative}.dropdown-toggle{white-space:nowrap}.dropdown-toggle:after{display:inline-block;margin-left:.255em;vertical-align:.255em;content:\"\";border-top:.3em solid;border-right:.3em solid transparent;border-bottom:0;border-left:.3em solid transparent}.dropdown-toggle:empty:after{margin-left:0}.dropdown-menu{position:absolute;top:100%;left:0;z-index:1000;display:none;float:left;min-width:10rem;padding:.5rem 0;margin:.125rem 0 0;font-size:1rem;color:#212529;text-align:left;list-style:none;background-color:#fff;background-clip:padding-box;border:1px solid rgba(0,0,0,.15);border-radius:.25rem}.dropdown-menu-left{right:auto;left:0}.dropdown-menu-right{right:0;left:auto}@media (min-width: 576px){.dropdown-menu-sm-left{right:auto;left:0}.dropdown-menu-sm-right{right:0;left:auto}}@media (min-width: 768px){.dropdown-menu-md-left{right:auto;left:0}.dropdown-menu-md-right{right:0;left:auto}}@media (min-width: 992px){.dropdown-menu-lg-left{right:auto;left:0}.dropdown-menu-lg-right{right:0;left:auto}}@media (min-width: 1200px){.dropdown-menu-xl-left{right:auto;left:0}.dropdown-menu-xl-right{right:0;left:auto}}.dropup .dropdown-menu{top:auto;bottom:100%;margin-top:0;margin-bottom:.125rem}.dropup .dropdown-toggle:after{display:inline-block;margin-left:.255em;vertical-align:.255em;content:\"\";border-top:0;border-right:.3em solid transparent;border-bottom:.3em solid;border-left:.3em solid transparent}.dropup .dropdown-toggle:empty:after{margin-left:0}.dropright .dropdown-menu{top:0;right:auto;left:100%;margin-top:0;margin-left:.125rem}.dropright .dropdown-toggle:after{display:inline-block;margin-left:.255em;vertical-align:.255em;content:\"\";border-top:.3em solid transparent;border-right:0;border-bottom:.3em solid transparent;border-left:.3em solid}.dropright .dropdown-toggle:empty:after{margin-left:0}.dropright .dropdown-toggle:after{vertical-align:0}.dropleft .dropdown-menu{top:0;right:100%;left:auto;margin-top:0;margin-right:.125rem}.dropleft .dropdown-toggle:after{display:inline-block;margin-left:.255em;vertical-align:.255em;content:\"\"}.dropleft .dropdown-toggle:after{display:none}.dropleft .dropdown-toggle:before{display:inline-block;margin-right:.255em;vertical-align:.255em;content:\"\";border-top:.3em solid transparent;border-right:.3em solid;border-bottom:.3em solid transparent}.dropleft .dropdown-toggle:empty:after{margin-left:0}.dropleft .dropdown-toggle:before{vertical-align:0}.dropdown-menu[x-placement^=top],.dropdown-menu[x-placement^=right],.dropdown-menu[x-placement^=bottom],.dropdown-menu[x-placement^=left]{right:auto;bottom:auto}.dropdown-divider{height:0;margin:.5rem 0;overflow:hidden;border-top:1px solid #e9ecef}.dropdown-item{display:block;width:100%;padding:.25rem 1.5rem;clear:both;font-weight:400;color:#212529;text-align:inherit;white-space:nowrap;background-color:transparent;border:0}.dropdown-item:hover,.dropdown-item:focus{color:#16181b;text-decoration:none;background-color:#f8f9fa}.dropdown-item.active,.dropdown-item:active{color:#fff;text-decoration:none;background-color:#007bff}.dropdown-item.disabled,.dropdown-item:disabled{color:#6c757d;pointer-events:none;background-color:transparent}.dropdown-menu.show{display:block}.dropdown-header{display:block;padding:.5rem 1.5rem;margin-bottom:0;font-size:.875rem;color:#6c757d;white-space:nowrap}.dropdown-item-text{display:block;padding:.25rem 1.5rem;color:#212529}\n", "li.iti__country:hover{background-color:#0000000d}.iti__selected-flag.dropdown-toggle:after{content:none}.iti__flag-container.disabled{cursor:default!important}.iti.iti--allow-dropdown .flag-container.disabled:hover .iti__selected-flag{background:none}.country-dropdown{border:1px solid #ccc;width:-webkit-fit-content;width:-moz-fit-content;width:fit-content;padding:1px;border-collapse:collapse}.search-container{position:relative}.search-container input{width:100%;border:none;border-bottom:1px solid #ccc;padding-left:10px}.search-icon{position:absolute;z-index:2;width:25px;margin:1px 10px}.iti__country-list{position:relative;border:none}.iti input#country-search-box{padding-left:6px}.iti .selected-dial-code{margin-left:6px}.iti.separate-dial-code .iti__selected-flag,.iti.separate-dial-code.iti--allow-dropdown.iti-sdc-2 .iti__selected-flag,.iti.separate-dial-code.iti--allow-dropdown.iti-sdc-3 .iti__selected-flag,.iti.separate-dial-code.iti--allow-dropdown.iti-sdc-4 .iti__selected-flag{width:93px}.iti.separate-dial-code input,.iti.separate-dial-code.iti--allow-dropdown.iti-sdc-2 input,.iti.separate-dial-code.iti--allow-dropdown.iti-sdc-3 input,.iti.separate-dial-code.iti--allow-dropdown.iti-sdc-4 input{padding-left:98px}\n"] }]
        }], ctorParameters: function () { return [{ type: i1.CountryCode }]; }, propDecorators: { value: [{
                type: Input
            }], preferredCountries: [{
                type: Input
            }], enablePlaceholder: [{
                type: Input
            }], customPlaceholder: [{
                type: Input
            }], numberFormat: [{
                type: Input
            }], cssClass: [{
                type: Input
            }], onlyCountries: [{
                type: Input
            }], enableAutoCountrySelect: [{
                type: Input
            }], searchCountryFlag: [{
                type: Input
            }], searchCountryField: [{
                type: Input
            }], searchCountryPlaceholder: [{
                type: Input
            }], maxLength: [{
                type: Input
            }], selectFirstCountry: [{
                type: Input
            }], selectedCountryISO: [{
                type: Input
            }], phoneValidation: [{
                type: Input
            }], inputId: [{
                type: Input
            }], separateDialCode: [{
                type: Input
            }], countryChange: [{
                type: Output
            }], countryList: [{
                type: ViewChild,
                args: ['countryList']
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LWludGwtdGVsLWlucHV0LmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL25neC1pbnRsLXRlbC1pbnB1dC9zcmMvbGliL25neC1pbnRsLXRlbC1pbnB1dC5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi9wcm9qZWN0cy9uZ3gtaW50bC10ZWwtaW5wdXQvc3JjL2xpYi9uZ3gtaW50bC10ZWwtaW5wdXQuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLLEdBQUcsTUFBTSx1QkFBdUIsQ0FBQztBQUU3QyxPQUFPLEVBQ04sU0FBUyxFQUVULFlBQVksRUFDWixVQUFVLEVBQ1YsS0FBSyxFQUdMLE1BQU0sRUFFTixTQUFTLEdBQ1QsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFFLGFBQWEsRUFBRSxpQkFBaUIsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBRWxFLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUUvQyxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFFbEQsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sbUNBQW1DLENBQUM7QUFHdkUsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sZ0NBQWdDLENBQUM7QUFDdEUsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sa0NBQWtDLENBQUM7Ozs7Ozs7QUFzQnJFLE1BQU0sT0FBTyx3QkFBd0I7SUErQ3BDLFlBQW9CLGVBQTRCO1FBQTVCLG9CQUFlLEdBQWYsZUFBZSxDQUFhO1FBOUN2QyxVQUFLLEdBQUcsRUFBRSxDQUFDO1FBQ1gsdUJBQWtCLEdBQWtCLEVBQUUsQ0FBQztRQUN2QyxzQkFBaUIsR0FBRyxJQUFJLENBQUM7UUFFekIsaUJBQVksR0FBc0IsaUJBQWlCLENBQUMsYUFBYSxDQUFDO1FBQ2xFLGFBQVEsR0FBRyxjQUFjLENBQUM7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QUFqQixLQUFLO2dCQUNHLGtCQUFrQjtzQkFBMUIsS0FBSztnQkFDRyxrQkFBa0I7c0JBQTFCLEtBQUs7Z0JBQ0csZUFBZTtzQkFBdkIsS0FBSztnQkFDRyxPQUFPO3NCQUFmLEtBQUs7Z0JBQ0csZ0JBQWdCO3NCQUF4QixLQUFLO2dCQUdhLGFBQWE7c0JBQS9CLE1BQU07Z0JBc0JtQixXQUFXO3NCQUFwQyxTQUFTO3VCQUFDLGFBQWEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBscG4gZnJvbSAnZ29vZ2xlLWxpYnBob25lbnVtYmVyJztcblxuaW1wb3J0IHtcblx0Q29tcG9uZW50LFxuXHRFbGVtZW50UmVmLFxuXHRFdmVudEVtaXR0ZXIsXG5cdGZvcndhcmRSZWYsXG5cdElucHV0LFxuXHRPbkNoYW5nZXMsXG5cdE9uSW5pdCxcblx0T3V0cHV0LFxuXHRTaW1wbGVDaGFuZ2VzLFxuXHRWaWV3Q2hpbGQsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgTkdfVkFMSURBVE9SUywgTkdfVkFMVUVfQUNDRVNTT1IgfSBmcm9tICdAYW5ndWxhci9mb3Jtcyc7XG5cbmltcG9ydCB7IHNldFRoZW1lIH0gZnJvbSAnbmd4LWJvb3RzdHJhcC91dGlscyc7XG5cbmltcG9ydCB7IENvdW50cnlDb2RlIH0gZnJvbSAnLi9kYXRhL2NvdW50cnktY29kZSc7XG5pbXBvcnQgeyBDb3VudHJ5SVNPIH0gZnJvbSAnLi9lbnVtcy9jb3VudHJ5LWlzby5lbnVtJztcbmltcG9ydCB7IFNlYXJjaENvdW50cnlGaWVsZCB9IGZyb20gJy4vZW51bXMvc2VhcmNoLWNvdW50cnktZmllbGQuZW51bSc7XG5pbXBvcnQgdHlwZSB7IENoYW5nZURhdGEgfSBmcm9tICcuL2ludGVyZmFjZXMvY2hhbmdlLWRhdGEnO1xuaW1wb3J0IHR5cGUgeyBDb3VudHJ5IH0gZnJvbSAnLi9tb2RlbC9jb3VudHJ5Lm1vZGVsJztcbmltcG9ydCB7IHBob25lTnVtYmVyVmFsaWRhdG9yIH0gZnJvbSAnLi9uZ3gtaW50bC10ZWwtaW5wdXQudmFsaWRhdG9yJztcbmltcG9ydCB7IFBob25lTnVtYmVyRm9ybWF0IH0gZnJvbSAnLi9lbnVtcy9waG9uZS1udW1iZXItZm9ybWF0LmVudW0nO1xuXG5AQ29tcG9uZW50KHtcblx0Ly8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBjb21wb25lbnQtc2VsZWN0b3Jcblx0c2VsZWN0b3I6ICduZ3gtaW50bC10ZWwtaW5wdXQnLFxuXHR0ZW1wbGF0ZVVybDogJy4vbmd4LWludGwtdGVsLWlucHV0LmNvbXBvbmVudC5odG1sJyxcblx0c3R5bGVVcmxzOiBbJy4vYm9vdHN0cmFwLWRyb3Bkb3duLmNzcycsICcuL25neC1pbnRsLXRlbC1pbnB1dC5jb21wb25lbnQuY3NzJ10sXG5cdHByb3ZpZGVyczogW1xuXHRcdENvdW50cnlDb2RlLFxuXHRcdHtcblx0XHRcdHByb3ZpZGU6IE5HX1ZBTFVFX0FDQ0VTU09SLFxuXHRcdFx0Ly8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWZvcndhcmQtcmVmXG5cdFx0XHR1c2VFeGlzdGluZzogZm9yd2FyZFJlZigoKSA9PiBOZ3hJbnRsVGVsSW5wdXRDb21wb25lbnQpLFxuXHRcdFx0bXVsdGk6IHRydWUsXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRwcm92aWRlOiBOR19WQUxJREFUT1JTLFxuXHRcdFx0dXNlVmFsdWU6IHBob25lTnVtYmVyVmFsaWRhdG9yLFxuXHRcdFx0bXVsdGk6IHRydWUsXG5cdFx0fSxcblx0XSxcbn0pXG5leHBvcnQgY2xhc3MgTmd4SW50bFRlbElucHV0Q29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0LCBPbkNoYW5nZXMge1xuXHRASW5wdXQoKSB2YWx1ZSA9ICcnO1xuXHRASW5wdXQoKSBwcmVmZXJyZWRDb3VudHJpZXM6IEFycmF5PHN0cmluZz4gPSBbXTtcblx0QElucHV0KCkgZW5hYmxlUGxhY2Vob2xkZXIgPSB0cnVlO1xuXHRASW5wdXQoKSBjdXN0b21QbGFjZWhvbGRlcjogc3RyaW5nO1xuXHRASW5wdXQoKSBudW1iZXJGb3JtYXQ6IFBob25lTnVtYmVyRm9ybWF0ID0gUGhvbmVOdW1iZXJGb3JtYXQuSW50ZXJuYXRpb25hbDtcblx0QElucHV0KCkgY3NzQ2xhc3MgPSAnZm9ybS1jb250cm9sJztcblx0QElucHV0KCkgb25seUNvdW50cmllczogQXJyYXk8c3RyaW5nPiA9IFtdO1xuXHRASW5wdXQoKSBlbmFibGVBdXRvQ291bnRyeVNlbGVjdCA9IHRydWU7XG5cdEBJbnB1dCgpIHNlYXJjaENvdW50cnlGbGFnID0gZmFsc2U7XG5cdEBJbnB1dCgpIHNlYXJjaENvdW50cnlGaWVsZDogU2VhcmNoQ291bnRyeUZpZWxkW10gPSBbU2VhcmNoQ291bnRyeUZpZWxkLkFsbF07XG5cdEBJbnB1dCgpIHNlYXJjaENvdW50cnlQbGFjZWhvbGRlciA9ICdTZWFyY2ggQ291bnRyeSc7XG5cdEBJbnB1dCgpIG1heExlbmd0aCA9ICcnO1xuXHRASW5wdXQoKSBzZWxlY3RGaXJzdENvdW50cnkgPSB0cnVlO1xuXHRASW5wdXQoKSBzZWxlY3RlZENvdW50cnlJU086IENvdW50cnlJU087XG5cdEBJbnB1dCgpIHBob25lVmFsaWRhdGlvbiA9IHRydWU7XG5cdEBJbnB1dCgpIGlucHV0SWQgPSAncGhvbmUnO1xuXHRASW5wdXQoKSBzZXBhcmF0ZURpYWxDb2RlID0gZmFsc2U7XG5cdHNlcGFyYXRlRGlhbENvZGVDbGFzczogc3RyaW5nO1xuXG5cdEBPdXRwdXQoKSByZWFkb25seSBjb3VudHJ5Q2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxDb3VudHJ5PigpO1xuXG5cdHNlbGVjdGVkQ291bnRyeTogQ291bnRyeSA9IHtcblx0XHRhcmVhQ29kZXM6IHVuZGVmaW5lZCxcblx0XHRkaWFsQ29kZTogJycsXG5cdFx0aHRtbElkOiAnJyxcblx0XHRmbGFnQ2xhc3M6ICcnLFxuXHRcdGlzbzI6ICcnLFxuXHRcdG5hbWU6ICcnLFxuXHRcdHBsYWNlSG9sZGVyOiAnJyxcblx0XHRwcmlvcml0eTogMCxcblx0fTtcblxuXHRwaG9uZU51bWJlciA9ICcnO1xuXHRhbGxDb3VudHJpZXM6IEFycmF5PENvdW50cnk+ID0gW107XG5cdHByZWZlcnJlZENvdW50cmllc0luRHJvcERvd246IEFycmF5PENvdW50cnk+ID0gW107XG5cdC8vIEhhcyB0byBiZSAnYW55JyB0byBwcmV2ZW50IGEgbmVlZCB0byBpbnN0YWxsIEB0eXBlcy9nb29nbGUtbGlicGhvbmVudW1iZXIgYnkgdGhlIHBhY2thZ2UgdXNlci4uLlxuXHRwaG9uZVV0aWw6IGFueSA9IGxwbi5QaG9uZU51bWJlclV0aWwuZ2V0SW5zdGFuY2UoKTtcblx0ZGlzYWJsZWQgPSBmYWxzZTtcblx0ZXJyb3JzOiBBcnJheTxhbnk+ID0gWydQaG9uZSBudW1iZXIgaXMgcmVxdWlyZWQuJ107XG5cdGNvdW50cnlTZWFyY2hUZXh0ID0gJyc7XG5cblx0QFZpZXdDaGlsZCgnY291bnRyeUxpc3QnKSBjb3VudHJ5TGlzdDogRWxlbWVudFJlZjtcblxuXHRvblRvdWNoZWQgPSAoKSA9PiB7fTtcblx0cHJvcGFnYXRlQ2hhbmdlID0gKF86IENoYW5nZURhdGEpID0+IHt9O1xuXG5cdGNvbnN0cnVjdG9yKHByaXZhdGUgY291bnRyeUNvZGVEYXRhOiBDb3VudHJ5Q29kZSkge1xuXHRcdC8vIElmIHRoaXMgaXMgbm90IHNldCwgbmd4LWJvb3RzdHJhcCB3aWxsIHRyeSB0byB1c2UgdGhlIGJzMyBDU1MgKHdoaWNoIGlzIG5vdCB3aGF0IHdlJ3ZlIGVtYmVkZGVkKSBhbmQgd2lsbFxuXHRcdC8vIEFkZCB0aGUgd3JvbmcgY2xhc3NlcyBhbmQgc3VjaFxuXHRcdHNldFRoZW1lKCdiczQnKTtcblx0fVxuXG5cdG5nT25Jbml0KCkge1xuXHRcdHRoaXMuaW5pdCgpO1xuXHR9XG5cblx0bmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcykge1xuXHRcdGNvbnN0IHNlbGVjdGVkSVNPID0gY2hhbmdlc1snc2VsZWN0ZWRDb3VudHJ5SVNPJ107XG5cdFx0aWYgKFxuXHRcdFx0dGhpcy5hbGxDb3VudHJpZXMgJiZcblx0XHRcdHNlbGVjdGVkSVNPICYmXG5cdFx0XHRzZWxlY3RlZElTTy5jdXJyZW50VmFsdWUgIT09IHNlbGVjdGVkSVNPLnByZXZpb3VzVmFsdWVcblx0XHQpIHtcblx0XHRcdHRoaXMudXBkYXRlU2VsZWN0ZWRDb3VudHJ5KCk7XG5cdFx0fVxuXHRcdGlmIChjaGFuZ2VzLnByZWZlcnJlZENvdW50cmllcykge1xuXHRcdFx0dGhpcy51cGRhdGVQcmVmZXJyZWRDb3VudHJpZXMoKTtcblx0XHR9XG5cdFx0dGhpcy5jaGVja1NlcGFyYXRlRGlhbENvZGVTdHlsZSgpO1xuXHR9XG5cblx0Lypcblx0XHRUaGlzIGlzIGEgd3JhcHBlciBtZXRob2QgdG8gYXZvaWQgY2FsbGluZyB0aGlzLm5nT25Jbml0KCkgaW4gd3JpdGVWYWx1ZSgpLlxuXHRcdFJlZjogaHR0cDovL2NvZGVseXplci5jb20vcnVsZXMvbm8tbGlmZS1jeWNsZS1jYWxsL1xuXHQqL1xuXHRpbml0KCkge1xuXHRcdHRoaXMuZmV0Y2hDb3VudHJ5RGF0YSgpO1xuXHRcdGlmICh0aGlzLnByZWZlcnJlZENvdW50cmllcy5sZW5ndGgpIHtcblx0XHRcdHRoaXMudXBkYXRlUHJlZmVycmVkQ291bnRyaWVzKCk7XG5cdFx0fVxuXHRcdGlmICh0aGlzLm9ubHlDb3VudHJpZXMubGVuZ3RoKSB7XG5cdFx0XHR0aGlzLmFsbENvdW50cmllcyA9IHRoaXMuYWxsQ291bnRyaWVzLmZpbHRlcigoYykgPT5cblx0XHRcdFx0dGhpcy5vbmx5Q291bnRyaWVzLmluY2x1ZGVzKGMuaXNvMilcblx0XHRcdCk7XG5cdFx0fVxuXHRcdGlmICh0aGlzLnNlbGVjdEZpcnN0Q291bnRyeSkge1xuXHRcdFx0aWYgKHRoaXMucHJlZmVycmVkQ291bnRyaWVzSW5Ecm9wRG93bi5sZW5ndGgpIHtcblx0XHRcdFx0dGhpcy5zZXRTZWxlY3RlZENvdW50cnkodGhpcy5wcmVmZXJyZWRDb3VudHJpZXNJbkRyb3BEb3duWzBdKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuc2V0U2VsZWN0ZWRDb3VudHJ5KHRoaXMuYWxsQ291bnRyaWVzWzBdKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0dGhpcy51cGRhdGVTZWxlY3RlZENvdW50cnkoKTtcblx0XHR0aGlzLmNoZWNrU2VwYXJhdGVEaWFsQ29kZVN0eWxlKCk7XG5cdH1cblxuXHRzZXRTZWxlY3RlZENvdW50cnkoY291bnRyeTogQ291bnRyeSkge1xuXHRcdHRoaXMuc2VsZWN0ZWRDb3VudHJ5ID0gY291bnRyeTtcblx0XHR0aGlzLmNvdW50cnlDaGFuZ2UuZW1pdChjb3VudHJ5KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBTZWFyY2ggY291bnRyeSBiYXNlZCBvbiBjb3VudHJ5IG5hbWUsIGlzbzIsIGRpYWxDb2RlIG9yIGFsbCBvZiB0aGVtLlxuXHQgKi9cblx0cHVibGljIHNlYXJjaENvdW50cnkoKSB7XG5cdFx0aWYgKCF0aGlzLmNvdW50cnlTZWFyY2hUZXh0KSB7XG5cdFx0XHR0aGlzLmNvdW50cnlMaXN0Lm5hdGl2ZUVsZW1lbnRcblx0XHRcdFx0LnF1ZXJ5U2VsZWN0b3IoJy5pdGlfX2NvdW50cnktbGlzdCBsaScpXG5cdFx0XHRcdC5zY3JvbGxJbnRvVmlldyh7XG5cdFx0XHRcdFx0YmVoYXZpb3I6ICdzbW9vdGgnLFxuXHRcdFx0XHRcdGJsb2NrOiAnbmVhcmVzdCcsXG5cdFx0XHRcdFx0aW5saW5lOiAnbmVhcmVzdCcsXG5cdFx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRjb25zdCBjb3VudHJ5U2VhcmNoVGV4dExvd2VyID0gdGhpcy5jb3VudHJ5U2VhcmNoVGV4dC50b0xvd2VyQ2FzZSgpO1xuXHRcdGNvbnN0IGNvdW50cnkgPSB0aGlzLmFsbENvdW50cmllcy5maWx0ZXIoKGMpID0+IHtcblx0XHRcdGlmICh0aGlzLnNlYXJjaENvdW50cnlGaWVsZC5pbmRleE9mKFNlYXJjaENvdW50cnlGaWVsZC5BbGwpID4gLTEpIHtcblx0XHRcdFx0Ly8gU2VhcmNoIGluIGFsbCBmaWVsZHNcblx0XHRcdFx0aWYgKGMuaXNvMi50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoY291bnRyeVNlYXJjaFRleHRMb3dlcikpIHtcblx0XHRcdFx0XHRyZXR1cm4gYztcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoYy5uYW1lLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aChjb3VudHJ5U2VhcmNoVGV4dExvd2VyKSkge1xuXHRcdFx0XHRcdHJldHVybiBjO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChjLmRpYWxDb2RlLnN0YXJ0c1dpdGgodGhpcy5jb3VudHJ5U2VhcmNoVGV4dCkpIHtcblx0XHRcdFx0XHRyZXR1cm4gYztcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gT3Igc2VhcmNoIGJ5IHNwZWNpZmljIFNlYXJjaENvdW50cnlGaWVsZChzKVxuXHRcdFx0XHRpZiAodGhpcy5zZWFyY2hDb3VudHJ5RmllbGQuaW5kZXhPZihTZWFyY2hDb3VudHJ5RmllbGQuSXNvMikgPiAtMSkge1xuXHRcdFx0XHRcdGlmIChjLmlzbzIudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKGNvdW50cnlTZWFyY2hUZXh0TG93ZXIpKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gYztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHRoaXMuc2VhcmNoQ291bnRyeUZpZWxkLmluZGV4T2YoU2VhcmNoQ291bnRyeUZpZWxkLk5hbWUpID4gLTEpIHtcblx0XHRcdFx0XHRpZiAoYy5uYW1lLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aChjb3VudHJ5U2VhcmNoVGV4dExvd2VyKSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIGM7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICh0aGlzLnNlYXJjaENvdW50cnlGaWVsZC5pbmRleE9mKFNlYXJjaENvdW50cnlGaWVsZC5EaWFsQ29kZSkgPiAtMSkge1xuXHRcdFx0XHRcdGlmIChjLmRpYWxDb2RlLnN0YXJ0c1dpdGgodGhpcy5jb3VudHJ5U2VhcmNoVGV4dCkpIHtcblx0XHRcdFx0XHRcdHJldHVybiBjO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0aWYgKGNvdW50cnkubGVuZ3RoID4gMCkge1xuXHRcdFx0Y29uc3QgZWwgPSB0aGlzLmNvdW50cnlMaXN0Lm5hdGl2ZUVsZW1lbnQucXVlcnlTZWxlY3Rvcihcblx0XHRcdFx0JyMnICsgY291bnRyeVswXS5odG1sSWRcblx0XHRcdCk7XG5cdFx0XHRpZiAoZWwpIHtcblx0XHRcdFx0ZWwuc2Nyb2xsSW50b1ZpZXcoe1xuXHRcdFx0XHRcdGJlaGF2aW9yOiAnc21vb3RoJyxcblx0XHRcdFx0XHRibG9jazogJ25lYXJlc3QnLFxuXHRcdFx0XHRcdGlubGluZTogJ25lYXJlc3QnLFxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHR0aGlzLmNoZWNrU2VwYXJhdGVEaWFsQ29kZVN0eWxlKCk7XG5cdH1cblxuXHRwdWJsaWMgb25QaG9uZU51bWJlckNoYW5nZSgpOiB2b2lkIHtcblx0XHRsZXQgY291bnRyeUNvZGU6IHN0cmluZyB8IHVuZGVmaW5lZDtcblx0XHQvLyBIYW5kbGUgdGhlIGNhc2Ugd2hlcmUgdGhlIHVzZXIgc2V0cyB0aGUgdmFsdWUgcHJvZ3JhbWF0aWNhbGx5IGJhc2VkIG9uIGEgcGVyc2lzdGVkIENoYW5nZURhdGEgb2JqLlxuXHRcdGlmICh0aGlzLnBob25lTnVtYmVyICYmIHR5cGVvZiB0aGlzLnBob25lTnVtYmVyID09PSAnb2JqZWN0Jykge1xuXHRcdFx0Y29uc3QgbnVtYmVyT2JqOiBDaGFuZ2VEYXRhID0gdGhpcy5waG9uZU51bWJlcjtcblx0XHRcdHRoaXMucGhvbmVOdW1iZXIgPSBudW1iZXJPYmoubnVtYmVyO1xuXHRcdFx0Y291bnRyeUNvZGUgPSBudW1iZXJPYmouY291bnRyeUNvZGU7XG5cdFx0fVxuXG5cdFx0dGhpcy52YWx1ZSA9IHRoaXMucGhvbmVOdW1iZXI7XG5cdFx0Y291bnRyeUNvZGUgPSBjb3VudHJ5Q29kZSB8fCB0aGlzLnNlbGVjdGVkQ291bnRyeS5pc28yO1xuXHRcdGNvbnN0IG51bWJlciA9IHRoaXMuZ2V0UGFyc2VkTnVtYmVyKHRoaXMucGhvbmVOdW1iZXIsIGNvdW50cnlDb2RlKTtcblxuXHRcdC8vIGF1dG8gc2VsZWN0IGNvdW50cnkgYmFzZWQgb24gdGhlIGV4dGVuc2lvbiAoYW5kIGFyZWFDb2RlIGlmIG5lZWRlZCkgKGUuZyBzZWxlY3QgQ2FuYWRhIGlmIG51bWJlciBzdGFydHMgd2l0aCArMSA0MTYpXG5cdFx0aWYgKHRoaXMuZW5hYmxlQXV0b0NvdW50cnlTZWxlY3QpIHtcblx0XHRcdGNvdW50cnlDb2RlID1cblx0XHRcdFx0bnVtYmVyICYmIG51bWJlci5nZXRDb3VudHJ5Q29kZSgpXG5cdFx0XHRcdFx0PyB0aGlzLmdldENvdW50cnlJc29Db2RlKG51bWJlci5nZXRDb3VudHJ5Q29kZSgpLCBudW1iZXIpXG5cdFx0XHRcdFx0OiB0aGlzLnNlbGVjdGVkQ291bnRyeS5pc28yO1xuXHRcdFx0aWYgKGNvdW50cnlDb2RlICYmIGNvdW50cnlDb2RlICE9PSB0aGlzLnNlbGVjdGVkQ291bnRyeS5pc28yKSB7XG5cdFx0XHRcdGNvbnN0IG5ld0NvdW50cnkgPSB0aGlzLmFsbENvdW50cmllc1xuXHRcdFx0XHRcdC5zb3J0KChhLCBiKSA9PiB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gYS5wcmlvcml0eSAtIGIucHJpb3JpdHk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQuZmluZCgoYykgPT4gYy5pc28yID09PSBjb3VudHJ5Q29kZSk7XG5cdFx0XHRcdGlmIChuZXdDb3VudHJ5KSB7XG5cdFx0XHRcdFx0dGhpcy5zZWxlY3RlZENvdW50cnkgPSBuZXdDb3VudHJ5O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGNvdW50cnlDb2RlID0gY291bnRyeUNvZGUgPyBjb3VudHJ5Q29kZSA6IHRoaXMuc2VsZWN0ZWRDb3VudHJ5LmlzbzI7XG5cblx0XHR0aGlzLmNoZWNrU2VwYXJhdGVEaWFsQ29kZVN0eWxlKCk7XG5cblx0XHRpZiAoIXRoaXMudmFsdWUpIHtcblx0XHRcdC8vIFJlYXNvbjogYXZvaWQgaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzU0MzU4MTMzLzE2MTc1OTBcblx0XHRcdC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tbnVsbC1rZXl3b3JkXG5cdFx0XHR0aGlzLnByb3BhZ2F0ZUNoYW5nZShudWxsKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3QgaW50bE5vID0gbnVtYmVyXG5cdFx0XHRcdD8gdGhpcy5waG9uZVV0aWwuZm9ybWF0KG51bWJlciwgbHBuLlBob25lTnVtYmVyRm9ybWF0LklOVEVSTkFUSU9OQUwpXG5cdFx0XHRcdDogJyc7XG5cblx0XHRcdC8vIHBhcnNlIHBob25lTnVtYmVyIGlmIHNlcGFyYXRlIGRpYWwgY29kZSBpcyBuZWVkZWRcblx0XHRcdGlmICh0aGlzLnNlcGFyYXRlRGlhbENvZGUgJiYgaW50bE5vKSB7XG5cdFx0XHRcdHRoaXMudmFsdWUgPSB0aGlzLnJlbW92ZURpYWxDb2RlKGludGxObyk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMucHJvcGFnYXRlQ2hhbmdlKHtcblx0XHRcdFx0bnVtYmVyOiB0aGlzLnZhbHVlLFxuXHRcdFx0XHRpbnRlcm5hdGlvbmFsTnVtYmVyOiBpbnRsTm8sXG5cdFx0XHRcdG5hdGlvbmFsTnVtYmVyOiBudW1iZXJcblx0XHRcdFx0XHQ/IHRoaXMucGhvbmVVdGlsLmZvcm1hdChudW1iZXIsIGxwbi5QaG9uZU51bWJlckZvcm1hdC5OQVRJT05BTClcblx0XHRcdFx0XHQ6ICcnLFxuXHRcdFx0XHRlMTY0TnVtYmVyOiBudW1iZXJcblx0XHRcdFx0XHQ/IHRoaXMucGhvbmVVdGlsLmZvcm1hdChudW1iZXIsIGxwbi5QaG9uZU51bWJlckZvcm1hdC5FMTY0KVxuXHRcdFx0XHRcdDogJycsXG5cdFx0XHRcdGNvdW50cnlDb2RlOiBjb3VudHJ5Q29kZS50b1VwcGVyQ2FzZSgpLFxuXHRcdFx0XHRkaWFsQ29kZTogJysnICsgdGhpcy5zZWxlY3RlZENvdW50cnkuZGlhbENvZGUsXG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cblxuXHRwdWJsaWMgb25Db3VudHJ5U2VsZWN0KGNvdW50cnk6IENvdW50cnksIGVsKTogdm9pZCB7XG5cdFx0dGhpcy5zZXRTZWxlY3RlZENvdW50cnkoY291bnRyeSk7XG5cblx0XHR0aGlzLmNoZWNrU2VwYXJhdGVEaWFsQ29kZVN0eWxlKCk7XG5cblx0XHRpZiAodGhpcy5waG9uZU51bWJlciAmJiB0aGlzLnBob25lTnVtYmVyLmxlbmd0aCA+IDApIHtcblx0XHRcdHRoaXMudmFsdWUgPSB0aGlzLnBob25lTnVtYmVyO1xuXHRcdFx0Y29uc3QgbnVtYmVyID0gdGhpcy5nZXRQYXJzZWROdW1iZXIoXG5cdFx0XHRcdHRoaXMucGhvbmVOdW1iZXIsXG5cdFx0XHRcdHRoaXMuc2VsZWN0ZWRDb3VudHJ5LmlzbzJcblx0XHRcdCk7XG5cdFx0XHRjb25zdCBpbnRsTm8gPSBudW1iZXJcblx0XHRcdFx0PyB0aGlzLnBob25lVXRpbC5mb3JtYXQobnVtYmVyLCBscG4uUGhvbmVOdW1iZXJGb3JtYXQuSU5URVJOQVRJT05BTClcblx0XHRcdFx0OiAnJztcblx0XHRcdC8vIHBhcnNlIHBob25lTnVtYmVyIGlmIHNlcGFyYXRlIGRpYWwgY29kZSBpcyBuZWVkZWRcblx0XHRcdGlmICh0aGlzLnNlcGFyYXRlRGlhbENvZGUgJiYgaW50bE5vKSB7XG5cdFx0XHRcdHRoaXMudmFsdWUgPSB0aGlzLnJlbW92ZURpYWxDb2RlKGludGxObyk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMucHJvcGFnYXRlQ2hhbmdlKHtcblx0XHRcdFx0bnVtYmVyOiB0aGlzLnZhbHVlLFxuXHRcdFx0XHRpbnRlcm5hdGlvbmFsTnVtYmVyOiBpbnRsTm8sXG5cdFx0XHRcdG5hdGlvbmFsTnVtYmVyOiBudW1iZXJcblx0XHRcdFx0XHQ/IHRoaXMucGhvbmVVdGlsLmZvcm1hdChudW1iZXIsIGxwbi5QaG9uZU51bWJlckZvcm1hdC5OQVRJT05BTClcblx0XHRcdFx0XHQ6ICcnLFxuXHRcdFx0XHRlMTY0TnVtYmVyOiBudW1iZXJcblx0XHRcdFx0XHQ/IHRoaXMucGhvbmVVdGlsLmZvcm1hdChudW1iZXIsIGxwbi5QaG9uZU51bWJlckZvcm1hdC5FMTY0KVxuXHRcdFx0XHRcdDogJycsXG5cdFx0XHRcdGNvdW50cnlDb2RlOiB0aGlzLnNlbGVjdGVkQ291bnRyeS5pc28yLnRvVXBwZXJDYXNlKCksXG5cdFx0XHRcdGRpYWxDb2RlOiAnKycgKyB0aGlzLnNlbGVjdGVkQ291bnRyeS5kaWFsQ29kZSxcblx0XHRcdH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBSZWFzb246IGF2b2lkIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vYS81NDM1ODEzMy8xNjE3NTkwXG5cdFx0XHQvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLW51bGwta2V5d29yZFxuXHRcdFx0dGhpcy5wcm9wYWdhdGVDaGFuZ2UobnVsbCk7XG5cdFx0fVxuXG5cdFx0ZWwuZm9jdXMoKTtcblx0fVxuXG5cdHB1YmxpYyBvbklucHV0S2V5UHJlc3MoZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiB2b2lkIHtcblx0XHRjb25zdCBhbGxvd2VkQ2hhcnMgPSAvWzAtOVxcK1xcLVxcKFxcKVxcIF0vO1xuXHRcdGNvbnN0IGFsbG93ZWRDdHJsQ2hhcnMgPSAvW2F4Y3ZdLzsgLy8gQWxsb3dzIGNvcHktcGFzdGluZ1xuXHRcdGNvbnN0IGFsbG93ZWRPdGhlcktleXMgPSBbXG5cdFx0XHQnQXJyb3dMZWZ0Jyxcblx0XHRcdCdBcnJvd1VwJyxcblx0XHRcdCdBcnJvd1JpZ2h0Jyxcblx0XHRcdCdBcnJvd0Rvd24nLFxuXHRcdFx0J0hvbWUnLFxuXHRcdFx0J0VuZCcsXG5cdFx0XHQnSW5zZXJ0Jyxcblx0XHRcdCdEZWxldGUnLFxuXHRcdFx0J0JhY2tzcGFjZScsXG5cdFx0XTtcblxuXHRcdGlmIChcblx0XHRcdCFhbGxvd2VkQ2hhcnMudGVzdChldmVudC5rZXkpICYmXG5cdFx0XHQhKGV2ZW50LmN0cmxLZXkgJiYgYWxsb3dlZEN0cmxDaGFycy50ZXN0KGV2ZW50LmtleSkpICYmXG5cdFx0XHQhYWxsb3dlZE90aGVyS2V5cy5pbmNsdWRlcyhldmVudC5rZXkpXG5cdFx0KSB7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH1cblx0fVxuXG5cdHJlZ2lzdGVyT25DaGFuZ2UoZm46IGFueSk6IHZvaWQge1xuXHRcdHRoaXMucHJvcGFnYXRlQ2hhbmdlID0gZm47XG5cdH1cblxuXHRyZWdpc3Rlck9uVG91Y2hlZChmbjogYW55KSB7XG5cdFx0dGhpcy5vblRvdWNoZWQgPSBmbjtcblx0fVxuXG5cdHNldERpc2FibGVkU3RhdGUoaXNEaXNhYmxlZDogYm9vbGVhbik6IHZvaWQge1xuXHRcdHRoaXMuZGlzYWJsZWQgPSBpc0Rpc2FibGVkO1xuXHR9XG5cblx0d3JpdGVWYWx1ZShvYmo6IGFueSk6IHZvaWQge1xuXHRcdGlmIChvYmogPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0dGhpcy5pbml0KCk7XG5cdFx0fVxuXHRcdHRoaXMucGhvbmVOdW1iZXIgPSBvYmo7XG5cdFx0c2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHR0aGlzLm9uUGhvbmVOdW1iZXJDaGFuZ2UoKTtcblx0XHR9LCAxKTtcblx0fVxuXG5cdHJlc29sdmVQbGFjZWhvbGRlcigpOiBzdHJpbmcge1xuXHRcdGxldCBwbGFjZWhvbGRlciA9ICcnO1xuXHRcdGlmICh0aGlzLmN1c3RvbVBsYWNlaG9sZGVyKSB7XG5cdFx0XHRwbGFjZWhvbGRlciA9IHRoaXMuY3VzdG9tUGxhY2Vob2xkZXI7XG5cdFx0fSBlbHNlIGlmICh0aGlzLnNlbGVjdGVkQ291bnRyeS5wbGFjZUhvbGRlcikge1xuXHRcdFx0cGxhY2Vob2xkZXIgPSB0aGlzLnNlbGVjdGVkQ291bnRyeS5wbGFjZUhvbGRlcjtcblx0XHRcdGlmICh0aGlzLnNlcGFyYXRlRGlhbENvZGUpIHtcblx0XHRcdFx0cGxhY2Vob2xkZXIgPSB0aGlzLnJlbW92ZURpYWxDb2RlKHBsYWNlaG9sZGVyKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIHBsYWNlaG9sZGVyO1xuXHR9XG5cblx0LyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEhlbHBlcnMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblx0LyoqXG5cdCAqIFJldHVybnMgcGFyc2UgUGhvbmVOdW1iZXIgb2JqZWN0LlxuXHQgKiBAcGFyYW0gcGhvbmVOdW1iZXIgc3RyaW5nXG5cdCAqIEBwYXJhbSBjb3VudHJ5Q29kZSBzdHJpbmdcblx0ICovXG5cdHByaXZhdGUgZ2V0UGFyc2VkTnVtYmVyKFxuXHRcdHBob25lTnVtYmVyOiBzdHJpbmcsXG5cdFx0Y291bnRyeUNvZGU6IHN0cmluZ1xuXHQpOiBscG4uUGhvbmVOdW1iZXIge1xuXHRcdGxldCBudW1iZXI6IGxwbi5QaG9uZU51bWJlcjtcblx0XHR0cnkge1xuXHRcdFx0bnVtYmVyID0gdGhpcy5waG9uZVV0aWwucGFyc2UocGhvbmVOdW1iZXIsIGNvdW50cnlDb2RlLnRvVXBwZXJDYXNlKCkpO1xuXHRcdH0gY2F0Y2ggKGUpIHt9XG5cdFx0cmV0dXJuIG51bWJlcjtcblx0fVxuXG5cdC8qKlxuXHQgKiBBZGp1c3RzIGlucHV0IGFsaWdubWVudCBiYXNlZCBvbiB0aGUgZGlhbCBjb2RlIHByZXNlbnRhdGlvbiBzdHlsZS5cblx0ICovXG5cdHByaXZhdGUgY2hlY2tTZXBhcmF0ZURpYWxDb2RlU3R5bGUoKSB7XG5cdFx0aWYgKHRoaXMuc2VwYXJhdGVEaWFsQ29kZSAmJiB0aGlzLnNlbGVjdGVkQ291bnRyeSkge1xuXHRcdFx0Y29uc3QgY250cnlDZCA9IHRoaXMuc2VsZWN0ZWRDb3VudHJ5LmRpYWxDb2RlO1xuXHRcdFx0dGhpcy5zZXBhcmF0ZURpYWxDb2RlQ2xhc3MgPVxuXHRcdFx0XHQnc2VwYXJhdGUtZGlhbC1jb2RlIGl0aS1zZGMtJyArIChjbnRyeUNkLmxlbmd0aCArIDEpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnNlcGFyYXRlRGlhbENvZGVDbGFzcyA9ICcnO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBDbGVhbnMgZGlhbGNvZGUgZnJvbSBwaG9uZSBudW1iZXIgc3RyaW5nLlxuXHQgKiBAcGFyYW0gcGhvbmVOdW1iZXIgc3RyaW5nXG5cdCAqL1xuXHRwcml2YXRlIHJlbW92ZURpYWxDb2RlKHBob25lTnVtYmVyOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRcdGNvbnN0IG51bWJlciA9IHRoaXMuZ2V0UGFyc2VkTnVtYmVyKHBob25lTnVtYmVyLCB0aGlzLnNlbGVjdGVkQ291bnRyeS5pc28yKTtcblx0XHRwaG9uZU51bWJlciA9IHRoaXMucGhvbmVVdGlsLmZvcm1hdChcblx0XHRcdG51bWJlcixcblx0XHRcdGxwbi5QaG9uZU51bWJlckZvcm1hdFt0aGlzLm51bWJlckZvcm1hdF1cblx0XHQpO1xuXHRcdGlmIChwaG9uZU51bWJlci5zdGFydHNXaXRoKCcrJykgJiYgdGhpcy5zZXBhcmF0ZURpYWxDb2RlKSB7XG5cdFx0XHRwaG9uZU51bWJlciA9IHBob25lTnVtYmVyLnN1YnN0cihwaG9uZU51bWJlci5pbmRleE9mKCcgJykgKyAxKTtcblx0XHR9XG5cdFx0cmV0dXJuIHBob25lTnVtYmVyO1xuXHR9XG5cblx0LyoqXG5cdCAqIFNpZnRzIHRocm91Z2ggYWxsIGNvdW50cmllcyBhbmQgcmV0dXJucyBpc28gY29kZSBvZiB0aGUgcHJpbWFyeSBjb3VudHJ5XG5cdCAqIGJhc2VkIG9uIHRoZSBudW1iZXIgcHJvdmlkZWQuXG5cdCAqIEBwYXJhbSBjb3VudHJ5Q29kZSBjb3VudHJ5IGNvZGUgaW4gbnVtYmVyIGZvcm1hdFxuXHQgKiBAcGFyYW0gbnVtYmVyIFBob25lTnVtYmVyIG9iamVjdFxuXHQgKi9cblx0cHJpdmF0ZSBnZXRDb3VudHJ5SXNvQ29kZShcblx0XHRjb3VudHJ5Q29kZTogbnVtYmVyLFxuXHRcdG51bWJlcjogbHBuLlBob25lTnVtYmVyXG5cdCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG5cdFx0Ly8gV2lsbCB1c2UgdGhpcyB0byBtYXRjaCBhcmVhIGNvZGUgZnJvbSB0aGUgZmlyc3QgbnVtYmVyc1xuXHRcdGNvbnN0IHJhd051bWJlciA9IG51bWJlclsndmFsdWVzXyddWycyJ10udG9TdHJpbmcoKTtcblx0XHQvLyBMaXN0IG9mIGFsbCBjb3VudHJpZXMgd2l0aCBjb3VudHJ5Q29kZSAoY2FuIGJlIG1vcmUgdGhhbiBvbmUuIGUueC4gVVMsIENBLCBETywgUFIgYWxsIGhhdmUgKzEgY291bnRyeUNvZGUpXG5cdFx0Y29uc3QgY291bnRyaWVzID0gdGhpcy5hbGxDb3VudHJpZXMuZmlsdGVyKFxuXHRcdFx0KGMpID0+IGMuZGlhbENvZGUgPT09IGNvdW50cnlDb2RlLnRvU3RyaW5nKClcblx0XHQpO1xuXHRcdC8vIE1haW4gY291bnRyeSBpcyB0aGUgY291bnRyeSwgd2hpY2ggaGFzIG5vIGFyZWFDb2RlcyBzcGVjaWZpZWQgaW4gY291bnRyeS1jb2RlLnRzIGZpbGUuXG5cdFx0Y29uc3QgbWFpbkNvdW50cnkgPSBjb3VudHJpZXMuZmluZCgoYykgPT4gYy5hcmVhQ29kZXMgPT09IHVuZGVmaW5lZCk7XG5cdFx0Ly8gU2Vjb25kYXJ5IGNvdW50cmllcyBhcmUgYWxsIGNvdW50cmllcywgd2hpY2ggaGF2ZSBhcmVhQ29kZXMgc3BlY2lmaWVkIGluIGNvdW50cnktY29kZS50cyBmaWxlLlxuXHRcdGNvbnN0IHNlY29uZGFyeUNvdW50cmllcyA9IGNvdW50cmllcy5maWx0ZXIoXG5cdFx0XHQoYykgPT4gYy5hcmVhQ29kZXMgIT09IHVuZGVmaW5lZFxuXHRcdCk7XG5cdFx0bGV0IG1hdGNoZWRDb3VudHJ5ID0gbWFpbkNvdW50cnkgPyBtYWluQ291bnRyeS5pc28yIDogdW5kZWZpbmVkO1xuXG5cdFx0Lypcblx0XHRcdEl0ZXJhdGUgb3ZlciBlYWNoIHNlY29uZGFyeSBjb3VudHJ5IGFuZCBjaGVjayBpZiBuYXRpb25hbE51bWJlciBzdGFydHMgd2l0aCBhbnkgb2YgYXJlYUNvZGVzIGF2YWlsYWJsZS5cblx0XHRcdElmIG5vIG1hdGNoZXMgZm91bmQsIGZhbGxiYWNrIHRvIHRoZSBtYWluIGNvdW50cnkuXG5cdFx0Ki9cblx0XHRzZWNvbmRhcnlDb3VudHJpZXMuZm9yRWFjaCgoY291bnRyeSkgPT4ge1xuXHRcdFx0Y291bnRyeS5hcmVhQ29kZXMuZm9yRWFjaCgoYXJlYUNvZGUpID0+IHtcblx0XHRcdFx0aWYgKHJhd051bWJlci5zdGFydHNXaXRoKGFyZWFDb2RlKSkge1xuXHRcdFx0XHRcdG1hdGNoZWRDb3VudHJ5ID0gY291bnRyeS5pc28yO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBtYXRjaGVkQ291bnRyeTtcblx0fVxuXG5cdC8qKlxuXHQgKiBHZXRzIGZvcm1hdHRlZCBleGFtcGxlIHBob25lIG51bWJlciBmcm9tIHBob25lVXRpbC5cblx0ICogQHBhcmFtIGNvdW50cnlDb2RlIHN0cmluZ1xuXHQgKi9cblx0cHJvdGVjdGVkIGdldFBob25lTnVtYmVyUGxhY2VIb2xkZXIoY291bnRyeUNvZGU6IHN0cmluZyk6IHN0cmluZyB7XG5cdFx0dHJ5IHtcblx0XHRcdHJldHVybiB0aGlzLnBob25lVXRpbC5mb3JtYXQoXG5cdFx0XHRcdHRoaXMucGhvbmVVdGlsLmdldEV4YW1wbGVOdW1iZXIoY291bnRyeUNvZGUpLFxuXHRcdFx0XHRscG4uUGhvbmVOdW1iZXJGb3JtYXRbdGhpcy5udW1iZXJGb3JtYXRdXG5cdFx0XHQpO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHJldHVybiBlO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBDbGVhcmluZyB0aGUgbGlzdCB0byBhdm9pZCBkdXBsaWNhdGVzIChodHRwczovL2dpdGh1Yi5jb20vd2ViY2F0MTIzNDUvbmd4LWludGwtdGVsLWlucHV0L2lzc3Vlcy8yNDgpXG5cdCAqL1xuXHRwcm90ZWN0ZWQgZmV0Y2hDb3VudHJ5RGF0YSgpOiB2b2lkIHtcblx0XHR0aGlzLmFsbENvdW50cmllcyA9IFtdO1xuXG5cdFx0dGhpcy5jb3VudHJ5Q29kZURhdGEuYWxsQ291bnRyaWVzLmZvckVhY2goKGMpID0+IHtcblx0XHRcdGNvbnN0IGNvdW50cnk6IENvdW50cnkgPSB7XG5cdFx0XHRcdG5hbWU6IGNbMF0udG9TdHJpbmcoKSxcblx0XHRcdFx0aXNvMjogY1sxXS50b1N0cmluZygpLFxuXHRcdFx0XHRkaWFsQ29kZTogY1syXS50b1N0cmluZygpLFxuXHRcdFx0XHRwcmlvcml0eTogK2NbM10gfHwgMCxcblx0XHRcdFx0YXJlYUNvZGVzOiAoY1s0XSBhcyBzdHJpbmdbXSkgfHwgdW5kZWZpbmVkLFxuXHRcdFx0XHRodG1sSWQ6IGBpdGktMF9faXRlbS0ke2NbMV0udG9TdHJpbmcoKX1gLFxuXHRcdFx0XHRmbGFnQ2xhc3M6IGBpdGlfXyR7Y1sxXS50b1N0cmluZygpLnRvTG9jYWxlTG93ZXJDYXNlKCl9YCxcblx0XHRcdFx0cGxhY2VIb2xkZXI6ICcnLFxuXHRcdFx0fTtcblxuXHRcdFx0aWYgKHRoaXMuZW5hYmxlUGxhY2Vob2xkZXIpIHtcblx0XHRcdFx0Y291bnRyeS5wbGFjZUhvbGRlciA9IHRoaXMuZ2V0UGhvbmVOdW1iZXJQbGFjZUhvbGRlcihcblx0XHRcdFx0XHRjb3VudHJ5LmlzbzIudG9VcHBlckNhc2UoKVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmFsbENvdW50cmllcy5wdXNoKGNvdW50cnkpO1xuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIFBvcHVsYXRlcyBwcmVmZXJyZWRDb3VudHJpZXNJbkRyb3BEb3duIHdpdGggcHJlZmZlcnJlZCBjb3VudHJpZXMuXG5cdCAqL1xuXHRwcml2YXRlIHVwZGF0ZVByZWZlcnJlZENvdW50cmllcygpIHtcblx0XHRpZiAodGhpcy5wcmVmZXJyZWRDb3VudHJpZXMubGVuZ3RoKSB7XG5cdFx0XHR0aGlzLnByZWZlcnJlZENvdW50cmllc0luRHJvcERvd24gPSBbXTtcblx0XHRcdHRoaXMucHJlZmVycmVkQ291bnRyaWVzLmZvckVhY2goKGlzbzIpID0+IHtcblx0XHRcdFx0Y29uc3QgcHJlZmVycmVkQ291bnRyeSA9IHRoaXMuYWxsQ291bnRyaWVzLmZpbHRlcigoYykgPT4ge1xuXHRcdFx0XHRcdHJldHVybiBjLmlzbzIgPT09IGlzbzI7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdHRoaXMucHJlZmVycmVkQ291bnRyaWVzSW5Ecm9wRG93bi5wdXNoKHByZWZlcnJlZENvdW50cnlbMF0pO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFVwZGF0ZXMgc2VsZWN0ZWRDb3VudHJ5LlxuXHQgKi9cblx0cHJpdmF0ZSB1cGRhdGVTZWxlY3RlZENvdW50cnkoKSB7XG5cdFx0aWYgKHRoaXMuc2VsZWN0ZWRDb3VudHJ5SVNPKSB7XG5cdFx0XHR0aGlzLnNlbGVjdGVkQ291bnRyeSA9IHRoaXMuYWxsQ291bnRyaWVzLmZpbmQoKGMpID0+IHtcblx0XHRcdFx0cmV0dXJuIGMuaXNvMi50b0xvd2VyQ2FzZSgpID09PSB0aGlzLnNlbGVjdGVkQ291bnRyeUlTTy50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0fSk7XG5cdFx0XHRpZiAodGhpcy5zZWxlY3RlZENvdW50cnkpIHtcblx0XHRcdFx0aWYgKHRoaXMucGhvbmVOdW1iZXIpIHtcblx0XHRcdFx0XHR0aGlzLm9uUGhvbmVOdW1iZXJDaGFuZ2UoKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBSZWFzb246IGF2b2lkIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vYS81NDM1ODEzMy8xNjE3NTkwXG5cdFx0XHRcdFx0Ly8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1udWxsLWtleXdvcmRcblx0XHRcdFx0XHR0aGlzLnByb3BhZ2F0ZUNoYW5nZShudWxsKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxufVxuIiwiPGRpdiBjbGFzcz1cIml0aSBpdGktLWFsbG93LWRyb3Bkb3duXCJcblx0W25nQ2xhc3NdPVwic2VwYXJhdGVEaWFsQ29kZUNsYXNzXCI+XG5cdDxkaXYgY2xhc3M9XCJpdGlfX2ZsYWctY29udGFpbmVyXCJcblx0XHRkcm9wZG93blxuXHRcdFtuZ0NsYXNzXT1cInsnZGlzYWJsZWQnOiBkaXNhYmxlZH1cIlxuXHRcdFtpc0Rpc2FibGVkXT1cImRpc2FibGVkXCI+XG5cdFx0PGRpdiBjbGFzcz1cIml0aV9fc2VsZWN0ZWQtZmxhZyBkcm9wZG93bi10b2dnbGVcIlxuXHRcdFx0ZHJvcGRvd25Ub2dnbGU+XG5cdFx0XHQ8ZGl2IGNsYXNzPVwiaXRpX19mbGFnXCJcblx0XHRcdFx0W25nQ2xhc3NdPVwic2VsZWN0ZWRDb3VudHJ5Py5mbGFnQ2xhc3NcIj48L2Rpdj5cblx0XHRcdDxkaXYgKm5nSWY9XCJzZXBhcmF0ZURpYWxDb2RlXCJcblx0XHRcdFx0Y2xhc3M9XCJzZWxlY3RlZC1kaWFsLWNvZGVcIj4re3tzZWxlY3RlZENvdW50cnkuZGlhbENvZGV9fTwvZGl2PlxuXHRcdFx0PGRpdiBjbGFzcz1cIml0aV9fYXJyb3dcIj48L2Rpdj5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2ICpkcm9wZG93bk1lbnVcblx0XHRcdGNsYXNzPVwiZHJvcGRvd24tbWVudSBjb3VudHJ5LWRyb3Bkb3duXCI+XG5cdFx0XHQ8ZGl2IGNsYXNzPVwic2VhcmNoLWNvbnRhaW5lclwiXG5cdFx0XHRcdCpuZ0lmPVwic2VhcmNoQ291bnRyeUZsYWcgJiYgc2VhcmNoQ291bnRyeUZpZWxkXCI+XG5cdFx0XHRcdDxpbnB1dCBpZD1cImNvdW50cnktc2VhcmNoLWJveFwiXG5cdFx0XHRcdFx0WyhuZ01vZGVsKV09XCJjb3VudHJ5U2VhcmNoVGV4dFwiXG5cdFx0XHRcdFx0KGtleXVwKT1cInNlYXJjaENvdW50cnkoKVwiXG5cdFx0XHRcdFx0KGNsaWNrKT1cIiRldmVudC5zdG9wUHJvcGFnYXRpb24oKVwiXG5cdFx0XHRcdFx0W3BsYWNlaG9sZGVyXT1cInNlYXJjaENvdW50cnlQbGFjZWhvbGRlclwiXG5cdFx0XHRcdFx0YXV0b2ZvY3VzPlxuXHRcdFx0PC9kaXY+XG5cdFx0XHQ8dWwgY2xhc3M9XCJpdGlfX2NvdW50cnktbGlzdFwiXG5cdFx0XHRcdCNjb3VudHJ5TGlzdD5cblx0XHRcdFx0PGxpIGNsYXNzPVwiaXRpX19jb3VudHJ5IGl0aV9fcHJlZmVycmVkXCJcblx0XHRcdFx0XHQqbmdGb3I9XCJsZXQgY291bnRyeSBvZiBwcmVmZXJyZWRDb3VudHJpZXNJbkRyb3BEb3duXCJcblx0XHRcdFx0XHQoY2xpY2spPVwib25Db3VudHJ5U2VsZWN0KGNvdW50cnksIGZvY3VzYWJsZSlcIlxuXHRcdFx0XHRcdFtpZF09XCJjb3VudHJ5Lmh0bWxJZCsnLXByZWZlcnJlZCdcIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzPVwiaXRpX19mbGFnLWJveFwiPlxuXHRcdFx0XHRcdFx0PGRpdiBjbGFzcz1cIml0aV9fZmxhZ1wiXG5cdFx0XHRcdFx0XHRcdFtuZ0NsYXNzXT1cImNvdW50cnkuZmxhZ0NsYXNzXCI+PC9kaXY+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PHNwYW4gY2xhc3M9XCJpdGlfX2NvdW50cnktbmFtZVwiPnt7Y291bnRyeS5uYW1lfX08L3NwYW4+XG5cdFx0XHRcdFx0PHNwYW4gY2xhc3M9XCJpdGlfX2RpYWwtY29kZVwiPit7e2NvdW50cnkuZGlhbENvZGV9fTwvc3Bhbj5cblx0XHRcdFx0PC9saT5cblx0XHRcdFx0PGxpIGNsYXNzPVwiaXRpX19kaXZpZGVyXCJcblx0XHRcdFx0XHQqbmdJZj1cInByZWZlcnJlZENvdW50cmllc0luRHJvcERvd24/Lmxlbmd0aFwiPjwvbGk+XG5cdFx0XHRcdDxsaSBjbGFzcz1cIml0aV9fY291bnRyeSBpdGlfX3N0YW5kYXJkXCJcblx0XHRcdFx0XHQqbmdGb3I9XCJsZXQgY291bnRyeSBvZiBhbGxDb3VudHJpZXNcIlxuXHRcdFx0XHRcdChjbGljayk9XCJvbkNvdW50cnlTZWxlY3QoY291bnRyeSwgZm9jdXNhYmxlKVwiXG5cdFx0XHRcdFx0W2lkXT1cImNvdW50cnkuaHRtbElkXCI+XG5cdFx0XHRcdFx0PGRpdiBjbGFzcz1cIml0aV9fZmxhZy1ib3hcIj5cblx0XHRcdFx0XHRcdDxkaXYgY2xhc3M9XCJpdGlfX2ZsYWdcIlxuXHRcdFx0XHRcdFx0XHRbbmdDbGFzc109XCJjb3VudHJ5LmZsYWdDbGFzc1wiPjwvZGl2PlxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHRcdDxzcGFuIGNsYXNzPVwiaXRpX19jb3VudHJ5LW5hbWVcIj57e2NvdW50cnkubmFtZX19PC9zcGFuPlxuXHRcdFx0XHRcdDxzcGFuIGNsYXNzPVwiaXRpX19kaWFsLWNvZGVcIj4re3tjb3VudHJ5LmRpYWxDb2RlfX08L3NwYW4+XG5cdFx0XHRcdDwvbGk+XG5cdFx0XHQ8L3VsPlxuXHRcdDwvZGl2PlxuXHQ8L2Rpdj5cblx0PGlucHV0IHR5cGU9XCJ0ZWxcIlxuXHRcdFtpZF09XCJpbnB1dElkXCJcblx0XHRhdXRvY29tcGxldGU9XCJvZmZcIlxuXHRcdFtuZ0NsYXNzXT1cImNzc0NsYXNzXCJcblx0XHQoYmx1cik9XCJvblRvdWNoZWQoKVwiXG5cdFx0KGtleXByZXNzKT1cIm9uSW5wdXRLZXlQcmVzcygkZXZlbnQpXCJcblx0XHRbKG5nTW9kZWwpXT1cInBob25lTnVtYmVyXCJcblx0XHQobmdNb2RlbENoYW5nZSk9XCJvblBob25lTnVtYmVyQ2hhbmdlKClcIlxuXHRcdFtkaXNhYmxlZF09XCJkaXNhYmxlZFwiXG5cdFx0W3BsYWNlaG9sZGVyXT1cInJlc29sdmVQbGFjZWhvbGRlcigpXCJcblx0XHRbYXR0ci5tYXhMZW5ndGhdPVwibWF4TGVuZ3RoXCJcblx0XHRbYXR0ci52YWxpZGF0aW9uXT1cInBob25lVmFsaWRhdGlvblwiXG5cdFx0I2ZvY3VzYWJsZT5cbjwvZGl2PlxuIl19
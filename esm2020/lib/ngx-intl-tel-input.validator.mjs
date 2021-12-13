import * as lpn from 'google-libphonenumber';
/*
We use "control: any" instead of "control: FormControl" to silence:
"Property 'nativeElement' does not exist on type 'FormControl'".
This happens because I've expanded control with nativeElement via
'NativeElementInjectorDirective' to get an access to the element.
More about this approach and reasons for this:
https://github.com/angular/angular/issues/18025
https://stackoverflow.com/a/54075119/1617590
*/
export const phoneNumberValidator = (control) => {
    if (!control.value) {
        return;
    }
    // Find <input> inside injected nativeElement and get its "id".
    const el = control.nativeElement;
    const inputBox = el
        ? el.querySelector('input[type="tel"]')
        : undefined;
    if (inputBox) {
        const id = inputBox.id;
        const isCheckValidation = inputBox.getAttribute('validation');
        if (isCheckValidation === 'true') {
            const isRequired = control.errors && control.errors.required === true;
            const error = { validatePhoneNumber: { valid: false } };
            inputBox.setCustomValidity('Invalid field.');
            let number;
            try {
                number = lpn.PhoneNumberUtil.getInstance().parse(control.value.number, control.value.countryCode);
            }
            catch (e) {
                if (isRequired === true) {
                    return error;
                }
                else {
                    inputBox.setCustomValidity('');
                }
            }
            if (control.value) {
                if (!number) {
                    return error;
                }
                else {
                    if (!lpn.PhoneNumberUtil.getInstance().isValidNumberForRegion(number, control.value.countryCode)) {
                        return error;
                    }
                    else {
                        inputBox.setCustomValidity('');
                    }
                }
            }
        }
        else if (isCheckValidation === 'false') {
            inputBox.setCustomValidity('');
            control.clearValidators();
        }
    }
    return;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmd4LWludGwtdGVsLWlucHV0LnZhbGlkYXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL25neC1pbnRsLXRlbC1pbnB1dC9zcmMvbGliL25neC1pbnRsLXRlbC1pbnB1dC52YWxpZGF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLLEdBQUcsTUFBTSx1QkFBdUIsQ0FBQztBQUU3Qzs7Ozs7Ozs7RUFRRTtBQUNGLE1BQU0sQ0FBQyxNQUFNLG9CQUFvQixHQUFHLENBQUMsT0FBWSxFQUFFLEVBQUU7SUFDcEQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUU7UUFDbkIsT0FBTztLQUNQO0lBQ0QsK0RBQStEO0lBQy9ELE1BQU0sRUFBRSxHQUFnQixPQUFPLENBQUMsYUFBNEIsQ0FBQztJQUM3RCxNQUFNLFFBQVEsR0FBcUIsRUFBRTtRQUNwQyxDQUFDLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQztRQUN2QyxDQUFDLENBQUMsU0FBUyxDQUFDO0lBQ2IsSUFBSSxRQUFRLEVBQUU7UUFDYixNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsRUFBRSxDQUFDO1FBQ3ZCLE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUM5RCxJQUFJLGlCQUFpQixLQUFLLE1BQU0sRUFBRTtZQUNqQyxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxLQUFLLElBQUksQ0FBQztZQUN0RSxNQUFNLEtBQUssR0FBRyxFQUFFLG1CQUFtQixFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUM7WUFFeEQsUUFBUSxDQUFDLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFFN0MsSUFBSSxNQUF1QixDQUFDO1lBRTVCLElBQUk7Z0JBQ0gsTUFBTSxHQUFHLEdBQUcsQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLENBQUMsS0FBSyxDQUMvQyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFDcEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQ3pCLENBQUM7YUFDRjtZQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUNYLElBQUksVUFBVSxLQUFLLElBQUksRUFBRTtvQkFDeEIsT0FBTyxLQUFLLENBQUM7aUJBQ2I7cUJBQU07b0JBQ04sUUFBUSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxDQUFDO2lCQUMvQjthQUNEO1lBRUQsSUFBSSxPQUFPLENBQUMsS0FBSyxFQUFFO2dCQUNsQixJQUFJLENBQUMsTUFBTSxFQUFFO29CQUNaLE9BQU8sS0FBSyxDQUFDO2lCQUNiO3FCQUFNO29CQUNOLElBQ0MsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxDQUFDLHNCQUFzQixDQUN4RCxNQUFNLEVBQ04sT0FBTyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQ3pCLEVBQ0E7d0JBQ0QsT0FBTyxLQUFLLENBQUM7cUJBQ2I7eUJBQU07d0JBQ04sUUFBUSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxDQUFDO3FCQUMvQjtpQkFDRDthQUNEO1NBQ0Q7YUFBTSxJQUFJLGlCQUFpQixLQUFLLE9BQU8sRUFBRTtZQUN6QyxRQUFRLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFL0IsT0FBTyxDQUFDLGVBQWUsRUFBRSxDQUFDO1NBQzFCO0tBQ0Q7SUFDRCxPQUFPO0FBQ1IsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgbHBuIGZyb20gJ2dvb2dsZS1saWJwaG9uZW51bWJlcic7XG5cbi8qXG5XZSB1c2UgXCJjb250cm9sOiBhbnlcIiBpbnN0ZWFkIG9mIFwiY29udHJvbDogRm9ybUNvbnRyb2xcIiB0byBzaWxlbmNlOlxuXCJQcm9wZXJ0eSAnbmF0aXZlRWxlbWVudCcgZG9lcyBub3QgZXhpc3Qgb24gdHlwZSAnRm9ybUNvbnRyb2wnXCIuXG5UaGlzIGhhcHBlbnMgYmVjYXVzZSBJJ3ZlIGV4cGFuZGVkIGNvbnRyb2wgd2l0aCBuYXRpdmVFbGVtZW50IHZpYVxuJ05hdGl2ZUVsZW1lbnRJbmplY3RvckRpcmVjdGl2ZScgdG8gZ2V0IGFuIGFjY2VzcyB0byB0aGUgZWxlbWVudC5cbk1vcmUgYWJvdXQgdGhpcyBhcHByb2FjaCBhbmQgcmVhc29ucyBmb3IgdGhpczpcbmh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvaXNzdWVzLzE4MDI1XG5odHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL2EvNTQwNzUxMTkvMTYxNzU5MFxuKi9cbmV4cG9ydCBjb25zdCBwaG9uZU51bWJlclZhbGlkYXRvciA9IChjb250cm9sOiBhbnkpID0+IHtcblx0aWYgKCFjb250cm9sLnZhbHVlKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdC8vIEZpbmQgPGlucHV0PiBpbnNpZGUgaW5qZWN0ZWQgbmF0aXZlRWxlbWVudCBhbmQgZ2V0IGl0cyBcImlkXCIuXG5cdGNvbnN0IGVsOiBIVE1MRWxlbWVudCA9IGNvbnRyb2wubmF0aXZlRWxlbWVudCBhcyBIVE1MRWxlbWVudDtcblx0Y29uc3QgaW5wdXRCb3g6IEhUTUxJbnB1dEVsZW1lbnQgPSBlbFxuXHRcdD8gZWwucXVlcnlTZWxlY3RvcignaW5wdXRbdHlwZT1cInRlbFwiXScpXG5cdFx0OiB1bmRlZmluZWQ7XG5cdGlmIChpbnB1dEJveCkge1xuXHRcdGNvbnN0IGlkID0gaW5wdXRCb3guaWQ7XG5cdFx0Y29uc3QgaXNDaGVja1ZhbGlkYXRpb24gPSBpbnB1dEJveC5nZXRBdHRyaWJ1dGUoJ3ZhbGlkYXRpb24nKTtcblx0XHRpZiAoaXNDaGVja1ZhbGlkYXRpb24gPT09ICd0cnVlJykge1xuXHRcdFx0Y29uc3QgaXNSZXF1aXJlZCA9IGNvbnRyb2wuZXJyb3JzICYmIGNvbnRyb2wuZXJyb3JzLnJlcXVpcmVkID09PSB0cnVlO1xuXHRcdFx0Y29uc3QgZXJyb3IgPSB7IHZhbGlkYXRlUGhvbmVOdW1iZXI6IHsgdmFsaWQ6IGZhbHNlIH0gfTtcblxuXHRcdFx0aW5wdXRCb3guc2V0Q3VzdG9tVmFsaWRpdHkoJ0ludmFsaWQgZmllbGQuJyk7XG5cblx0XHRcdGxldCBudW1iZXI6IGxwbi5QaG9uZU51bWJlcjtcblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0bnVtYmVyID0gbHBuLlBob25lTnVtYmVyVXRpbC5nZXRJbnN0YW5jZSgpLnBhcnNlKFxuXHRcdFx0XHRcdGNvbnRyb2wudmFsdWUubnVtYmVyLFxuXHRcdFx0XHRcdGNvbnRyb2wudmFsdWUuY291bnRyeUNvZGVcblx0XHRcdFx0KTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0aWYgKGlzUmVxdWlyZWQgPT09IHRydWUpIHtcblx0XHRcdFx0XHRyZXR1cm4gZXJyb3I7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0aW5wdXRCb3guc2V0Q3VzdG9tVmFsaWRpdHkoJycpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmIChjb250cm9sLnZhbHVlKSB7XG5cdFx0XHRcdGlmICghbnVtYmVyKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGVycm9yO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGlmIChcblx0XHRcdFx0XHRcdCFscG4uUGhvbmVOdW1iZXJVdGlsLmdldEluc3RhbmNlKCkuaXNWYWxpZE51bWJlckZvclJlZ2lvbihcblx0XHRcdFx0XHRcdFx0bnVtYmVyLFxuXHRcdFx0XHRcdFx0XHRjb250cm9sLnZhbHVlLmNvdW50cnlDb2RlXG5cdFx0XHRcdFx0XHQpXG5cdFx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZXJyb3I7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGlucHV0Qm94LnNldEN1c3RvbVZhbGlkaXR5KCcnKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKGlzQ2hlY2tWYWxpZGF0aW9uID09PSAnZmFsc2UnKSB7XG5cdFx0XHRpbnB1dEJveC5zZXRDdXN0b21WYWxpZGl0eSgnJyk7XG5cblx0XHRcdGNvbnRyb2wuY2xlYXJWYWxpZGF0b3JzKCk7XG5cdFx0fVxuXHR9XG5cdHJldHVybjtcbn07XG4iXX0=
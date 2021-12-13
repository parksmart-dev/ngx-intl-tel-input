import { Directive } from '@angular/core';
import * as i0 from "@angular/core";
import * as i1 from "@angular/forms";
/*
"Property 'nativeElement' does not exist on type 'FormControl'".
'NativeElementInjectorDirective' injects nativeElement to each control,
so we can access it from inside validator for example.
More about this approach and reasons for this:
https://github.com/angular/angular/issues/18025
https://stackoverflow.com/a/54075119/1617590
*/
export class NativeElementInjectorDirective {
    constructor(controlDir, host) {
        this.controlDir = controlDir;
        this.host = host;
    }
    ngOnInit() {
        if (this.controlDir.control) {
            this.controlDir.control['nativeElement'] = this.host.nativeElement;
        }
    }
}
NativeElementInjectorDirective.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: NativeElementInjectorDirective, deps: [{ token: i1.NgControl }, { token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Directive });
NativeElementInjectorDirective.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "13.1.0", type: NativeElementInjectorDirective, selector: "[ngModel], [formControl], [formControlName]", ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: NativeElementInjectorDirective, decorators: [{
            type: Directive,
            args: [{
                    // tslint:disable-next-line: directive-selector
                    selector: '[ngModel], [formControl], [formControlName]',
                }]
        }], ctorParameters: function () { return [{ type: i1.NgControl }, { type: i0.ElementRef }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF0aXZlLWVsZW1lbnQtaW5qZWN0b3IuZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvbmd4LWludGwtdGVsLWlucHV0L3NyYy9saWIvZGlyZWN0aXZlcy9uYXRpdmUtZWxlbWVudC1pbmplY3Rvci5kaXJlY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFNBQVMsRUFBc0IsTUFBTSxlQUFlLENBQUM7OztBQUc5RDs7Ozs7OztFQU9FO0FBS0YsTUFBTSxPQUFPLDhCQUE4QjtJQUMxQyxZQUNTLFVBQXFCLEVBQ3JCLElBQWlDO1FBRGpDLGVBQVUsR0FBVixVQUFVLENBQVc7UUFDckIsU0FBSSxHQUFKLElBQUksQ0FBNkI7SUFDdkMsQ0FBQztJQUNKLFFBQVE7UUFDUCxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFO1lBQzVCLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDO1NBQ25FO0lBQ0YsQ0FBQzs7MkhBVFcsOEJBQThCOytHQUE5Qiw4QkFBOEI7MkZBQTlCLDhCQUE4QjtrQkFKMUMsU0FBUzttQkFBQztvQkFDViwrQ0FBK0M7b0JBQy9DLFFBQVEsRUFBRSw2Q0FBNkM7aUJBQ3ZEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGlyZWN0aXZlLCBFbGVtZW50UmVmLCBPbkluaXQgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IE5nQ29udHJvbCB9IGZyb20gJ0Bhbmd1bGFyL2Zvcm1zJztcblxuLypcblwiUHJvcGVydHkgJ25hdGl2ZUVsZW1lbnQnIGRvZXMgbm90IGV4aXN0IG9uIHR5cGUgJ0Zvcm1Db250cm9sJ1wiLlxuJ05hdGl2ZUVsZW1lbnRJbmplY3RvckRpcmVjdGl2ZScgaW5qZWN0cyBuYXRpdmVFbGVtZW50IHRvIGVhY2ggY29udHJvbCxcbnNvIHdlIGNhbiBhY2Nlc3MgaXQgZnJvbSBpbnNpZGUgdmFsaWRhdG9yIGZvciBleGFtcGxlLlxuTW9yZSBhYm91dCB0aGlzIGFwcHJvYWNoIGFuZCByZWFzb25zIGZvciB0aGlzOlxuaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9pc3N1ZXMvMTgwMjVcbmh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vYS81NDA3NTExOS8xNjE3NTkwXG4qL1xuQERpcmVjdGl2ZSh7XG5cdC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogZGlyZWN0aXZlLXNlbGVjdG9yXG5cdHNlbGVjdG9yOiAnW25nTW9kZWxdLCBbZm9ybUNvbnRyb2xdLCBbZm9ybUNvbnRyb2xOYW1lXScsXG59KVxuZXhwb3J0IGNsYXNzIE5hdGl2ZUVsZW1lbnRJbmplY3RvckRpcmVjdGl2ZSBpbXBsZW1lbnRzIE9uSW5pdCB7XG5cdGNvbnN0cnVjdG9yKFxuXHRcdHByaXZhdGUgY29udHJvbERpcjogTmdDb250cm9sLFxuXHRcdHByaXZhdGUgaG9zdDogRWxlbWVudFJlZjxIVE1MRm9ybUVsZW1lbnQ+XG5cdCkge31cblx0bmdPbkluaXQoKSB7XG5cdFx0aWYgKHRoaXMuY29udHJvbERpci5jb250cm9sKSB7XG5cdFx0XHR0aGlzLmNvbnRyb2xEaXIuY29udHJvbFsnbmF0aXZlRWxlbWVudCddID0gdGhpcy5ob3N0Lm5hdGl2ZUVsZW1lbnQ7XG5cdFx0fVxuXHR9XG59XG4iXX0=
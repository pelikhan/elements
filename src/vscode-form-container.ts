import {
  LitElement,
  html,
  customElement,
  property,
  css,
  TemplateResult,
  query,
  queryAssignedNodes,
} from 'lit-element';
import {VscodeCheckbox} from './vscode-checkbox';
import {VscodeCheckboxGroup} from './vscode-checkbox-group';
import {VscodeFormGroup} from './vscode-form-group';
import {VscodeInputbox} from './vscode-inputbox';
import {VscodeMultiSelect} from './vscode-multi-select';
import {VscodeRadio} from './vscode-radio';
import {VscodeRadioGroup} from './vscode-radio-group';
import {VscodeSingleSelect} from './vscode-single-select';

enum FormGroupLayout {
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
}

type FormButtonWidgetGroup = VscodeRadioGroup | VscodeCheckboxGroup;

type VscFormWidget =
  | VscodeInputbox
  | VscodeSingleSelect
  | VscodeMultiSelect
  | VscodeCheckbox
  | VscodeRadio;

interface FormData {
  [key: string]: string | string[];
}

const isInputbox = (el: Element): el is VscodeInputbox => {
  return el.tagName.toLocaleLowerCase() === 'vscode-inputbox';
};

const isSingleSelect = (el: Element): el is VscodeSingleSelect => {
  return el.tagName.toLocaleLowerCase() === 'vscode-single-select';
};

const isMultiSelect = (el: Element): el is VscodeMultiSelect => {
  return el.tagName.toLocaleLowerCase() === 'vscode-multi-select';
};

const isCheckbox = (el: Element): el is VscodeCheckbox => {
  return el.tagName.toLocaleLowerCase() === 'vscode-checkbox';
};

const isRadio = (el: Element): el is VscodeRadio => {
  return el.tagName.toLocaleLowerCase() === 'vscode-radio';
};

@customElement('vscode-form-container')
export class VscodeFormContainer extends LitElement {
  @property({type: Boolean, reflect: true})
  set responsive(isResponsive: boolean) {
    this._responsive = isResponsive;

    if (this._firstUpdateComplete) {
      if (isResponsive) {
        this._activateResponsiveLayout();
      } else {
        this._deactivateResizeObserver();
      }
    }
  }
  get responsive(): boolean {
    return this._responsive;
  }

  @property({type: Number})
  breakpoint = 490;

  @property({type: Object})
  get data(): FormData {
    const query = [
      'vscode-inputbox',
      'vscode-single-select',
      'vscode-multi-select',
      'vscode-checkbox',
      'vscode-radio',
    ].join(',');
    const vscFormWidgets = this.querySelectorAll(
      query
    ) as NodeListOf<VscFormWidget>;
    const data: FormData = {};

    vscFormWidgets.forEach((widget) => {
      if (!widget.hasAttribute('name')) {
        return;
      }

      const name = widget.getAttribute('name') as string;

      if (!name) {
        return;
      }

      if ((isCheckbox(widget) && widget.checked) || isMultiSelect(widget)) {
        data[name] = Array.isArray(data[name])
          ? [...data[name], widget.value as string]
          : [widget.value as string];
      }

      if (isCheckbox(widget) && !widget.checked) {
        data[name] = Array.isArray(data[name]) ? data[name] : [];
      }

      if (
        (isRadio(widget) && widget.checked) ||
        isInputbox(widget) ||
        isSingleSelect(widget)
      ) {
        data[name] = widget.value;
      } else if (isRadio(widget) && !widget.checked) {
        data[name] = data[name] ? data[name] : '';
      }
    });

    return data;
  }

  private _resizeObserver!: ResizeObserver | null;

  @query('.wrapper')
  private _wrapperElement!: Element;

  @queryAssignedNodes()
  private _assignedNodes!: VscodeFormGroup[];

  private _responsive = false;

  private _firstUpdateComplete = false;

  private _currentFormGroupLayout!: FormGroupLayout;

  private _toggleCompactLayout(layout: FormGroupLayout) {
    const groups = this._assignedNodes.filter(
      (el) => el.matches && el.matches('vscode-form-group')
    );

    groups.forEach((group) => {
      group.vertical = layout === FormGroupLayout.VERTICAL;

      const widgetGroups = group.querySelectorAll(
        'vscode-checkbox-group, vscode-radio-group'
      ) as NodeListOf<FormButtonWidgetGroup>;

      widgetGroups.forEach((widgetGroup) => {
        if (!widgetGroup.dataset.originalLayout) {
          widgetGroup.dataset.originalLayout = widgetGroup.hasAttribute(
            'vertical'
          )
            ? FormGroupLayout.VERTICAL
            : FormGroupLayout.HORIZONTAL;
        }

        const originalLayout = widgetGroup.dataset.originalLayout;

        if (
          layout === FormGroupLayout.HORIZONTAL &&
          originalLayout === FormGroupLayout.HORIZONTAL
        ) {
          widgetGroup.vertical = false;
        } else {
          widgetGroup.vertical = true;
        }
      });
    });
  }

  private _resizeObserverCallback(entries: ResizeObserverEntry[]) {
    let wrapperWidth = 0;

    for (const entry of entries) {
      wrapperWidth = entry.contentRect.width;
    }

    const nextLayout: FormGroupLayout =
      wrapperWidth < this.breakpoint
        ? FormGroupLayout.VERTICAL
        : FormGroupLayout.HORIZONTAL;

    if (nextLayout !== this._currentFormGroupLayout) {
      this._toggleCompactLayout(nextLayout);
      this._currentFormGroupLayout = nextLayout;
    }
  }

  private _resizeObserverCallbackBound = this._resizeObserverCallback.bind(
    this
  );

  private _activateResponsiveLayout() {
    this._resizeObserver = new ResizeObserver(
      this._resizeObserverCallbackBound
    );
    this._resizeObserver.observe(this._wrapperElement);
  }

  private _deactivateResizeObserver() {
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
  }

  static styles = css`
    :host {
      display: block;
      max-width: 727px;
    }
  `;

  firstUpdated(): void {
    this._firstUpdateComplete = true;

    if (this._responsive) {
      this._activateResponsiveLayout();
    }
  }

  render(): TemplateResult {
    return html`
      <div class="wrapper">
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'vscode-form-container': VscodeFormContainer;
  }
}

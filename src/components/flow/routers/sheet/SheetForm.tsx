import { react as bindCallbacks } from 'auto-bind';
import * as React from 'react';
import Dialog, { ButtonSet } from 'components/dialog/Dialog';
import { RouterFormProps } from 'components/flow/props';
import TypeList from 'components/nodeeditor/TypeList';
import { FormEntry, FormState, mergeForm } from 'store/nodeEditor';
import i18n from 'config/i18n';
import TextInputElement from 'components/form/textinput/TextInputElement';
import styles from 'components/flow/routers/sheet/SheetForm.module.scss';
import AssetSelector from 'components/form/assetselector/AssetSelector';
import { nodeToState, stateToNode } from './helpers';
import { LowerCaseAlphaNumeric, Required, StartIsNonNumeric, validate } from 'store/validators';
import { hasErrors } from 'components/flow/actions/helpers';
import { Trans } from 'react-i18next';
import { snakify } from 'utils';

export interface SheetFormState extends FormState {
  sheet: FormEntry;
  result_name: FormEntry;
  row: FormEntry;
}

export default class SheetForm extends React.Component<RouterFormProps, SheetFormState> {
  constructor(props: RouterFormProps) {
    super(props);

    this.state = nodeToState(this.props.nodeSettings);

    bindCallbacks(this, {
      include: [/^on/, /^handle/]
    });
  }

  private validate() {
    const row = validate(i18n.t('forms.row', 'Select row'), this.state.row.value, [Required]);

    const result_name = validate(
      i18n.t('forms.sheet_result_name', 'Save row as'),
      this.state.result_name.value,
      [Required]
    );

    const sheet = validate(i18n.t('forms.sheet', 'Sheet'), this.state.sheet.value, [Required]);

    const updated = mergeForm(this.state, { row, result_name, sheet } as any);

    this.setState(updated);

    return updated.valid;
  }

  private handleSave(): void {
    let valid = this.validate();

    if (valid) {
      this.props.updateRouter(stateToNode(this.props.nodeSettings, this.state));
      this.props.onClose(false);
    }
  }

  private getButtons(): ButtonSet {
    return {
      primary: { name: i18n.t('buttons.ok', 'Ok'), onClick: this.handleSave },
      secondary: {
        name: i18n.t('buttons.cancel', 'Cancel'),
        onClick: () => this.props.onClose(true)
      }
    };
  }

  private handleUpdateResultName(value: string): void {
    const result_name = validate(i18n.t('forms.result_name', 'Result Name'), value, [
      LowerCaseAlphaNumeric,
      StartIsNonNumeric
    ]);

    this.setState({
      result_name,
      valid: !hasErrors(result_name)
    });
  }

  private handleSheetChanged(value: any) {
    const sheetValue = value.length > 0 ? value[0] : { id: '', name: '', url: '' };

    this.setState({
      sheet: { value: sheetValue }
    });
  }

  public renderEdit(): JSX.Element {
    const typeConfig = this.props.typeConfig;

    const { result_name, sheet, row } = this.state;

    const snaked =
      !hasErrors(result_name) && result_name.value ? '.' + snakify(result_name.value) : '';

    return (
      <Dialog title={typeConfig.name} headerClass={typeConfig.type} buttons={this.getButtons()}>
        <TypeList __className="" initialType={typeConfig} onChange={this.props.onTypeChange} />

        <div className={styles.delay_container}>
          <AssetSelector
            name={i18n.t('forms.sheet', 'Sheet')}
            placeholder={i18n.t('forms.select_sheet', 'Select sheet')}
            assets={this.props.assetStore.sheets}
            entry={sheet}
            searchable={true}
            onChange={this.handleSheetChanged}
          />
        </div>

        <div className={styles.row_field}>
          <TextInputElement
            showLabel={true}
            name={i18n.t('forms.row', 'Select row')}
            placeholder={i18n.t('forms.enter_profile_name', 'Enter value')}
            onChange={value => {
              this.setState({ row: { value } });
            }}
            entry={row}
            helpText={
              <Trans i18nKey="forms.row_name_help">
                Select row based on the values in the first column of the sheet. You can either use
                a static value or a variable from the first column.
              </Trans>
            }
            autocomplete={true}
            focus={true}
          />
        </div>

        <TextInputElement
          showLabel={true}
          maxLength={64}
          name={i18n.t('forms.sheet_result_name', 'Save row as')}
          onChange={this.handleUpdateResultName}
          entry={result_name}
          helpText={
            <Trans
              i18nKey="forms.sheet_result_help"
              values={{
                resultFormat: `@results${snaked}`,
                columnFormat: `@results${snaked}.column_title`
              }}
            >
              You can reference this row as [[resultFormat]] and a specific column can be referenced
              as [[columnFormat]]
            </Trans>
          }
        />
      </Dialog>
    );
  }

  public render(): JSX.Element {
    return this.renderEdit();
  }
}

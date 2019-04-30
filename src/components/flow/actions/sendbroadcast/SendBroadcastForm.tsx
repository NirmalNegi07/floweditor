import { react as bindCallbacks } from 'auto-bind';
import * as React from 'react';
import Dialog, { ButtonSet } from '~/components/dialog/Dialog';
import { hasErrors } from '~/components/flow/actions/helpers';
import { initializeForm, stateToAction } from '~/components/flow/actions/sendbroadcast/helpers';
import { ActionFormProps } from '~/components/flow/props';
import AssetSelector from '~/components/form/assetselector/AssetSelector';
import TextInputElement, { Count } from '~/components/form/textinput/TextInputElement';
import TypeList from '~/components/nodeeditor/TypeList';
import { fakePropType } from '~/config/ConfigProvider';
import { Asset } from '~/store/flowContext';
import {
    AssetArrayEntry,
    FormState,
    mergeForm,
    StringEntry,
    ValidationFailure
} from '~/store/nodeEditor';
import { validate, Required } from '~/store/validators';

export interface SendBroadcastFormState extends FormState {
    message: StringEntry;
    recipients: AssetArrayEntry;
}

// Note: action prop is only used for its uuid (see onValid)
export default class SendBroadcastForm extends React.Component<
    ActionFormProps,
    SendBroadcastFormState
> {
    public static contextTypes = {
        endpoints: fakePropType,
        assetService: fakePropType
    };

    constructor(props: ActionFormProps) {
        super(props);
        this.state = initializeForm(this.props.nodeSettings);
        bindCallbacks(this, {
            include: [/^on/, /^handle/]
        });
    }

    public handleRecipientsChanged(recipients: Asset[]): boolean {
        return this.handleUpdate({ recipients });
    }

    public handleMessageUpdate(text: string): boolean {
        return this.handleUpdate({ text });
    }

    private handleUpdate(keys: { text?: string; recipients?: Asset[] }): boolean {
        const updates: Partial<SendBroadcastFormState> = {};

        if (keys.hasOwnProperty('recipients')) {
            updates.recipients = validate('Recipients', keys.recipients, [Required]);
        }

        if (keys.hasOwnProperty('text')) {
            updates.message = validate('Message', keys.text, [Required]);
        }

        const updated = mergeForm(this.state, updates);
        this.setState(updated);
        return updated.valid;
    }

    private handleSave(): void {
        // validate in case they never updated an empty field
        const valid = this.handleUpdate({
            text: this.state.message.value,
            recipients: this.state.recipients.value
        });

        if (valid) {
            this.props.updateAction(stateToAction(this.props.nodeSettings, this.state));

            // notify our modal we are done
            this.props.onClose(false);
        }
    }

    private getButtons(): ButtonSet {
        return {
            primary: { name: 'Ok', onClick: this.handleSave },
            secondary: { name: 'Cancel', onClick: () => this.props.onClose(true) }
        };
    }

    public render(): JSX.Element {
        const typeConfig = this.props.typeConfig;
        return (
            <Dialog
                title={typeConfig.name}
                headerClass={typeConfig.type}
                buttons={this.getButtons()}
            >
                <TypeList
                    __className=""
                    initialType={typeConfig}
                    onChange={this.props.onTypeChange}
                />
                <AssetSelector
                    name="Recipients"
                    assets={this.props.assetStore.recipients}
                    entry={this.state.recipients}
                    completion={this.props.assetStore}
                    searchable={true}
                    multi={true}
                    onChange={this.handleRecipientsChanged}
                />
                <p />
                <TextInputElement
                    name="Message"
                    showLabel={false}
                    count={Count.SMS}
                    onChange={this.handleMessageUpdate}
                    entry={this.state.message}
                    onFieldFailures={(persistantFailures: ValidationFailure[]) => {
                        const message = { ...this.state.message, persistantFailures };
                        this.setState({ message, valid: this.state.valid && !hasErrors(message) });
                    }}
                    autocomplete={true}
                    focus={true}
                    textarea={true}
                />
            </Dialog>
        );
    }
}

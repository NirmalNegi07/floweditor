import { DragPoint } from '../components/Node';
import { FlowDefinition, SaveToContact, ChangeGroup, Exit } from '../FlowDefinition';

export interface ContactField {
    uuid: string;
    name: string;
}

export interface SearchResult {
    name: string,
    id: string,
    type: string,
    prefix?: string,
    extraResult?: boolean
}

export interface ContactFieldResult extends SearchResult {
    key?: string
}

interface ComponentDetails {
    nodeUUID: string;
    nodeIdx: number
    actionIdx?: number;
    actionUUID?: string;
    exitIdx?: number
    exitUUID?: string;
    pointers?: string[]
}

export class ComponentMap {

    private components: { [uuid: string]: ComponentDetails };
    private pendingConnections: { [uuid: string]: DragPoint };
    private contactFields: ContactFieldResult[];
    private groups: SearchResult[];

    // initialize our map with our flow def
    constructor(definition: FlowDefinition) {
        console.time("ComponentMap");
        this.initializeUUIDMap(definition);
        this.initializeFieldsAndGroups(definition);
        this.pendingConnections = {};
        console.timeEnd("ComponentMap");
    }

    public addPendingConnection(draggedTo: string, draggedFrom: DragPoint) {
        this.pendingConnections[draggedTo] = draggedFrom;
    }

    public getPendingConnection(nodeUUID: string): DragPoint {
        return this.pendingConnections[nodeUUID];
    }

    public removePendingConnection(nodeUUID: string) {
        delete this.pendingConnections[nodeUUID];
    }

    public initializeUUIDMap(definition: FlowDefinition) {

        var components: { [uuid: string]: ComponentDetails } = {};
        var exitsWithDestinations: Exit[] = [];

        if (!definition) {
            this.components = components;
            return;
        }

        // determine our indexes
        for (let nodeIdx = 0; nodeIdx < definition.nodes.length; nodeIdx++) {
            let node = definition.nodes[nodeIdx];
            components[node.uuid] = {
                nodeUUID: node.uuid,
                nodeIdx: nodeIdx,
                actionIdx: -1,
                exitIdx: -1,
                pointers: []
            }

            // map out our action idexes
            if (node.actions) {
                for (let actionIdx = 0; actionIdx < node.actions.length; actionIdx++) {
                    let action = node.actions[actionIdx];
                    components[action.uuid] = {
                        nodeUUID: node.uuid,
                        nodeIdx: nodeIdx,
                        actionUUID: action.uuid,
                        actionIdx: actionIdx,
                    }
                }
            }

            // and the same for exits
            if (node.exits) {
                for (let exitIdx = 0; exitIdx < node.exits.length; exitIdx++) {
                    let exit = node.exits[exitIdx];
                    components[exit.uuid] = {
                        nodeIdx: nodeIdx,
                        nodeUUID: node.uuid,
                        exitIdx: exitIdx,
                        exitUUID: exit.uuid
                    };

                    if (exit.destination_node_uuid) {
                        exitsWithDestinations.push(exit);
                    }
                }
            }
        }

        // add in our reverse lookups
        for (let exit of exitsWithDestinations) {
            components[exit.destination_node_uuid].pointers.push(exit.uuid);
        }

        this.components = components;

    }

    private initializeFieldsAndGroups(definition: FlowDefinition) {
        var fields: { [id: string]: ContactFieldResult } = {}
        var groups: { [id: string]: SearchResult } = {}

        if (!definition) {
            this.contactFields = [];
            this.groups = [];
            return;
        }

        var reservedFields: ContactFieldResult[] = [
            { id: "name", name: "Name", type: "update_contact" },
            // { id: "language", name: "Language", type: "update_contact" }
        ];

        // TODO: Add language support to save_contact_field
        // {id:"language", name: "Language", type: "field"}];

        for (let node of definition.nodes) {
            if (node.actions) {
                for (let action of node.actions) {
                    if (action.type == 'save_contact_field') {
                        var saveProps = action as SaveToContact;
                        if (!reservedFields.some(fieldName => fieldName.name === saveProps.field_name)) {
                            if (!(saveProps.field_uuid in fields)) {
                                fields[saveProps.field_uuid] = { id: saveProps.field_uuid, name: saveProps.field_name, type: "field" }
                            }
                        }
                    } else if (action.type == 'add_to_group' || action.type == 'remove_from_group') {
                        var groupProps = action as ChangeGroup;
                        for (let group of groupProps.groups) {
                            if (!(group.uuid in groups)) {
                                groups[group.uuid] = { id: group.uuid, name: group.name, type: "group" }
                            }
                        }
                    }
                }
            }
        }

        var existingFields: ContactFieldResult[] = []
        for (let reserved of reservedFields) {
            existingFields.push(reserved);
        }

        for (var key in fields) {
            existingFields.push(fields[key]);
        }

        var existingGroups: SearchResult[] = []
        for (var key in groups) {
            existingGroups.push(groups[key]);
        }

        this.contactFields = existingFields;
        this.groups = existingGroups;

        // console.log("fields", this.contactFields);
        // console.log("groups", this.groups);
    }

    public getDetails(uuid: string): ComponentDetails {
        return this.components[uuid];
    }

    public getGroups(): SearchResult[] {
        return this.groups;
    }

    public getContactFields(): ContactFieldResult[] {
        // console.log("Get", this.contactFields)
        return this.contactFields;
    }

    public addContactField(field: SearchResult): ContactFieldResult {
        this.contactFields.push(field);
        return field;
    }

    public addGroup(group: SearchResult): SearchResult {
        this.groups.push(group);
        return group;
    }

}

export default ComponentMap;
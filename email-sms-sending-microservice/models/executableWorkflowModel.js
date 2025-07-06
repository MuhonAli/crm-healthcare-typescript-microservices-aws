import mongoose, { Schema } from "mongoose";
const validEventChannels = ["email", "sms"]

const executableWorkflowSchema = new mongoose.Schema(
    {
        organization_id: {
            type: String,
            required: true,
        },
        workflow_id: {
            type: Schema.Types.ObjectId,
            ref: "workflows",
            required: true,
        },
        event_id: {
            type: Schema.Types.ObjectId,
            ref: "workflow_events",
            required: true,
        },
        opportunity_id: {
            type: Schema.Types.ObjectId,
        },
        opportunity_name: {
            type: String,
            required: true,
        },
        channel: {
            type: String,
            enum: validEventChannels,
            required: true,
        },
        contact_id: {
            type: String,
            required: true,
        },
        contact_name: {
            type: String,
            required: true,
        },
        contact_email: {
            type: String,
        },
        contact_phone: {
            type: String,
        },
        conversation_id: {
            type: String,
        },
        send_at: {
            type: Date,
            required: true,
        },
        sender: {
            sender_id: { type: String },
            first_name: { type: String },
            is_active: { type: Boolean },
            profile_pic_url: { type: String },
        },
        to: {
            email: {
                type: String,
            },
            name: {
                type: String,
            },
            _id: false,
        },
        from: {
            email: {
                type: String,
            },
            name: {
                type: String,
            },
            _id: false,
        },

        subject: {
            type: String,
        },
        content: [
            {
                type: {
                    type: String,
                },
                value: {
                    type: String,
                },
                _id: false,
            },
        ],
        attachments: [
            {
                content: {
                    type: String,
                },
                filename: {
                    type: String,
                },
                type: {
                    type: String,
                },
                disposition: {
                    type: String,
                },
            },
        ],
        sg_message_id: {
            type: String,
        },
        dst: {
            type: String,
        },
        src: {
            type: String,
        },
        text: {
            type: String,
        },
        pli_message_uuid: {
            type: String,
        },
        observers: {
            type: [String],
        },
        next_pipeline: {
            pipeline_id: { type: String },
            pipeline_stage: {
                stage_name: {
                    type: String,
                },
                order: {
                    type: Number,
                },
                is_default: {
                    type: Boolean,
                },
            },
        },
        is_tried: {
            type: Boolean,
            default: false,
        },
        is_sent: {
            type: Boolean,
            default: false,
        },
        is_last_event: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
        versionKey: false,
    }
);

executableWorkflowSchema.methods.toJSON = function () {
    const eventObject = this.toObject();
    // delete eventObject.is_deleted;
    return eventObject;
};

const ExecutableWorkflow = mongoose.model(
    "executable_workflows",
    executableWorkflowSchema
);

export default ExecutableWorkflow;

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const network = require("../../network");
const models_1 = require("../../models");
const short = require("short-uuid");
const rsa = require("../../crypto/rsa");
const jsonUtils = require("../../utils/json");
const socket = require("../../utils/socket");
const constants_1 = require("../../constants");
const tribes_1 = require("../../utils/tribes");
function broadcast(a) {
    return __awaiter(this, void 0, void 0, function* () {
        const { amount, content, bot_name, chat_uuid, msg_uuid, reply_uuid } = a;
        console.log('=> BOT BROADCAST');
        if (!content)
            return console.log('no content');
        if (!chat_uuid)
            return console.log('no chat_uuid');
        const theChat = yield tribes_1.getTribeOwnersChatByUUID(chat_uuid);
        if (!(theChat && theChat.id))
            return console.log('no chat');
        if (theChat.type !== constants_1.default.chat_types.tribe)
            return console.log('not a tribe');
        const owner = yield models_1.models.Contact.findOne({
            where: { id: theChat.tenant },
        });
        const tenant = owner.id;
        const encryptedForMeText = rsa.encrypt(owner.contactKey, content);
        const encryptedText = rsa.encrypt(theChat.groupKey, content);
        const textMap = { chat: encryptedText };
        var date = new Date();
        date.setMilliseconds(0);
        const alias = bot_name || 'Bot';
        const botContactId = -1;
        const msg = {
            chatId: theChat.id,
            uuid: msg_uuid || short.generate(),
            type: constants_1.default.message_types.bot_res,
            sender: botContactId,
            amount: amount || 0,
            date: date,
            messageContent: encryptedForMeText,
            remoteMessageContent: JSON.stringify(textMap),
            status: constants_1.default.statuses.confirmed,
            replyUuid: reply_uuid || '',
            createdAt: date,
            updatedAt: date,
            senderAlias: alias,
            tenant,
        };
        const message = yield models_1.models.Message.create(msg);
        socket.sendJson({
            type: 'message',
            response: jsonUtils.messageToJson(message, theChat, owner),
        }, tenant);
        // console.log("BOT BROADCASE MSG", owner.dataValues)
        // console.log('+++++++++> MSG TO BROADCAST', message.dataValues)
        yield network.sendMessage({
            chat: theChat,
            sender: Object.assign(Object.assign({}, owner.dataValues), { alias, id: botContactId, role: constants_1.default.chat_roles.reader }),
            message: {
                content: textMap,
                id: message.id,
                uuid: message.uuid,
                replyUuid: message.replyUuid,
            },
            type: constants_1.default.message_types.bot_res,
            success: () => ({ success: true }),
            failure: (e) => {
                return console.log(e);
            },
            isForwarded: true,
        });
    });
}
exports.default = broadcast;
//# sourceMappingURL=broadcast.js.map
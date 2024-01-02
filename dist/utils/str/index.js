"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    slug: function (text) {
        const listEncode = {
            'a': 'á|à|ạ|ả|ã|â|ấ|ầ|ậ|ẩ|ẫ|ă|ắ|ằ|ặ|ẳ|ẵ',
            'e': 'é|è|ẹ|ẻ|ẽ|ê|ế|ề|ệ|ể|ễ',
            'i': 'í|ì|ị|ỉ|ĩ',
            'o': 'ó|ò|ọ|ỏ|õ|ô|ố|ồ|ộ|ổ|ỗ|ơ|ớ|ờ|ợ|ở|ỡ',
            'u': 'ú|ù|ụ|ủ|ũ|ư|ứ|ừ|ự|ử|ữ',
            'y': 'ý|ỳ|ỵ|ỷ|ỹ',
            'd': 'đ'
        };
        for (let key in listEncode) {
            const regex = new RegExp(listEncode[key], 'g');
            text = text.toLowerCase().replace(regex, key).replace(/"/, "").replace(/\s|\//, "-");
        }
        return text;
    }
};

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const import_service_1 = require("./import.service");
const multer_1 = require("multer");
const public_decorator_1 = require("../auth/decorators/public.decorator");
let ImportController = class ImportController {
    constructor(importService) {
        this.importService = importService;
    }
    async importCsv(file, truncate, batchSize, req) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded. Use field name "file".');
        }
        return this.importService.importCsv(file.buffer, {
            truncate: truncate === 'true',
            batchSize: batchSize ? parseInt(batchSize, 10) : 500,
            filename: file.originalname,
            importedBy: req?.user?.username,
        });
    }
};
exports.ImportController = ImportController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('csv'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 100 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (!file.originalname.match(/\.(csv)$/i)) {
                return cb(new common_1.BadRequestException('Only CSV files are allowed'), false);
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Query)('truncate')),
    __param(2, (0, common_1.Query)('batchSize')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], ImportController.prototype, "importCsv", null);
exports.ImportController = ImportController = __decorate([
    (0, common_1.Controller)('import'),
    __metadata("design:paramtypes", [import_service_1.ImportService])
], ImportController);
//# sourceMappingURL=import.controller.js.map
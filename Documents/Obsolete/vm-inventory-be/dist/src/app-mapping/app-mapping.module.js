"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppMappingModule = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const app_mapping_controller_1 = require("./app-mapping.controller");
const app_mapping_service_1 = require("./app-mapping.service");
const prisma_module_1 = require("../prisma/prisma.module");
let AppMappingModule = class AppMappingModule {
};
exports.AppMappingModule = AppMappingModule;
exports.AppMappingModule = AppMappingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            platform_express_1.MulterModule.register({ limits: { fileSize: 10 * 1024 * 1024 } }),
        ],
        controllers: [app_mapping_controller_1.AppMappingController],
        providers: [app_mapping_service_1.AppMappingService],
        exports: [app_mapping_service_1.AppMappingService],
    })
], AppMappingModule);
//# sourceMappingURL=app-mapping.module.js.map
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryDepartmentDto = exports.QueryAppMappingDto = exports.QueryObsoleteDto = exports.OsType = void 0;
const class_validator_1 = require("class-validator");
var OsType;
(function (OsType) {
    OsType["Ubuntu"] = "Ubuntu";
    OsType["CentOS"] = "CentOS";
})(OsType || (exports.OsType = OsType = {}));
class QueryObsoleteDto {
}
exports.QueryObsoleteDto = QueryObsoleteDto;
__decorate([
    (0, class_validator_1.IsEnum)(OsType, { message: 'osType must be Ubuntu or CentOS' }),
    __metadata("design:type", String)
], QueryObsoleteDto.prototype, "osType", void 0);
class QueryAppMappingDto {
    constructor() {
        this.category = 'Production';
    }
}
exports.QueryAppMappingDto = QueryAppMappingDto;
__decorate([
    (0, class_validator_1.IsEnum)(OsType, { message: 'osType must be Ubuntu or CentOS' }),
    __metadata("design:type", String)
], QueryAppMappingDto.prototype, "osType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAppMappingDto.prototype, "category", void 0);
class QueryDepartmentDto {
}
exports.QueryDepartmentDto = QueryDepartmentDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(OsType, { message: 'osType must be Ubuntu or CentOS' }),
    __metadata("design:type", String)
], QueryDepartmentDto.prototype, "osType", void 0);
//# sourceMappingURL=query-summary.dto.js.map
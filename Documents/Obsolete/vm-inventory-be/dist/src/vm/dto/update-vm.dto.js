"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateVmDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_vm_dto_1 = require("./create-vm.dto");
class UpdateVmDto extends (0, mapped_types_1.PartialType)(create_vm_dto_1.CreateVmDto) {
}
exports.UpdateVmDto = UpdateVmDto;
//# sourceMappingURL=update-vm.dto.js.map
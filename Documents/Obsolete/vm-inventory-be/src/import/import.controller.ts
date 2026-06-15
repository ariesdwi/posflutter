import {
  Controller,
  Post,
  Query,
  Request,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { memoryStorage } from 'multer';
import { Public } from '../auth/decorators/public.decorator';

@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  /**
   * POST /api/import/csv
   * Upload a CSV file to import VM data into the database.
   *
   * Query params:
   *   - truncate (boolean, default false): clear table before import
   *   - batchSize (number, default 500): rows per DB batch insert
   *
   * Body: multipart/form-data with field "file" (CSV)
   */
  @Public()
  @Post('csv')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
      fileFilter: (_req, file, cb) => {
        if (!file.originalname.match(/\.(csv)$/i)) {
          return cb(new BadRequestException('Only CSV files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @Query('truncate') truncate?: string,
    @Query('batchSize') batchSize?: string,
    @Request() req?,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded. Use field name "file".');
    }

    return this.importService.importCsv(file.buffer, {
      truncate: truncate === 'true',
      batchSize: batchSize ? parseInt(batchSize, 10) : 500,
      filename: file.originalname,
      importedBy: req?.user?.username,
    });
  }
}

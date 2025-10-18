import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('photos')
export class Photo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column()
  originalName: string;

  @Column()
  path: string;

  @Column({ nullable: true })
  albumId: number;

  @Column({ type: 'bigint', default: 0 })
  size: number;

  @Column({ nullable: true })
  mimeType: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

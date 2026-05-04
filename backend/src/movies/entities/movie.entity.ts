import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('movies')
export class Movie {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 180 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'release_date', type: 'date' })
  releaseDate!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  budget!: string;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl: string | null = null;

  @Column({ name: 'trailer_url', type: 'varchar', length: 500, nullable: true })
  trailer: string | null = null;

  @Column({
    name: 'release_reminder_sent_at',
    type: 'timestamp',
    nullable: true,
  })
  releaseReminderSentAt: Date | null = null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner!: User;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

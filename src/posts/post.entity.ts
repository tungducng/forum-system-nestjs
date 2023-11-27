import { Category } from '../categories/category.entity';
import { User } from '../users//user.entity';
import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public title: string;

  @Column('text', { array: true })
  public paragraphs: string[];

  @Column({ nullable: true })
  public category?: string;

  @Index('post_authorId_index')
  @ManyToOne(() => User, (author: User) => author.posts)
  public author: User;

  @ManyToMany(() => Category, (category: Category) => category.posts)
  @JoinTable()
  public categories: Category[];
}

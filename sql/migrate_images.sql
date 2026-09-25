-- ============================================================
-- 图片链接迁移：dicebear/旧占位图 → ui-avatars + Unsplash CDN
-- 用于已有数据库的在线迁移，无需重建库
-- ============================================================

-- 歌手头像 → ui-avatars.com (文字风格，按风格配色)
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=Jay&size=200&background=589286&color=fff&bold=true&format=png' WHERE id = 1;
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=Eason&size=200&background=3B82F6&color=fff&bold=true&format=png' WHERE id = 2;
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=JJ&size=200&background=2563EB&color=fff&bold=true&format=png' WHERE id = 3;
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=GEM&size=200&background=8B5CF6&color=fff&bold=true&format=png' WHERE id = 4;
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=TS&size=200&background=EC4899&color=fff&bold=true&format=png' WHERE id = 5;
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=AMei&size=200&background=589286&color=fff&bold=true&format=png' WHERE id = 6;
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=Mayday&size=200&background=3B82F6&color=fff&bold=true&format=png' WHERE id = 7;
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=CL&size=200&background=06B6D4&color=fff&bold=true&format=png' WHERE id = 8;
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=Beyond&size=200&background=DB2777&color=fff&bold=true&format=png' WHERE id = 9;
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=ID&size=200&background=E11D48&color=fff&bold=true&format=png' WHERE id = 10;
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=CP&size=200&background=DC2626&color=fff&bold=true&format=png' WHERE id = 11;
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=Tang&size=200&background=B91C1C&color=fff&bold=true&format=png' WHERE id = 12;
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=NK&size=200&background=DB2777&color=fff&bold=true&format=png' WHERE id = 13;
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=ZL&size=200&background=059669&color=fff&bold=true&format=png' WHERE id = 14;
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=MBY&size=200&background=10B981&color=fff&bold=true&format=png' WHERE id = 15;
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=SDY&size=200&background=047857&color=fff&bold=true&format=png' WHERE id = 16;
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=FDC&size=200&background=34D399&color=fff&bold=true&format=png' WHERE id = 17;
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=AW&size=200&background=7C3AED&color=fff&bold=true&format=png' WHERE id = 18;
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=Mello&size=200&background=8B5CF6&color=fff&bold=true&format=png' WHERE id = 19;
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=SK&size=200&background=6D28D9&color=fff&bold=true&format=png' WHERE id = 20;
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=Bee&size=200&background=D946EF&color=fff&bold=true&format=png' WHERE id = 21;
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=Drizzy&size=200&background=EA580C&color=fff&bold=true&format=png' WHERE id = 22;
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=XZQ&size=200&background=C026D3&color=fff&bold=true&format=png' WHERE id = 23;
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=KDot&size=200&background=F97316&color=fff&bold=true&format=png' WHERE id = 24;
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=Will&size=200&background=EA580C&color=fff&bold=true&format=png' WHERE id = 25;
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=LL&size=200&background=4F46E5&color=fff&bold=true&format=png' WHERE id = 26;
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=NJ&size=200&background=B45309&color=fff&bold=true&format=png' WHERE id = 27;
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=DK&size=200&background=D97706&color=fff&bold=true&format=png' WHERE id = 28;
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=Liszt&size=200&background=4F46E5&color=fff&bold=true&format=png' WHERE id = 29;
UPDATE singer SET avatar = 'https://ui-avatars.com/api/?name=WRL&size=200&background=B45309&color=fff&bold=true&format=png' WHERE id = 30;

-- 歌曲封面 → images.unsplash.com (真实音乐摄影)
UPDATE song SET cover_url = REPLACE(cover_url, 'https://api.dicebear.com/9.x/shapes/svg?seed=', '') WHERE cover_url LIKE '%dicebear.com%shapes%';
UPDATE song SET cover_url = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%music1&size=300%';
UPDATE song SET cover_url = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%music2&size=300%';
UPDATE song SET cover_url = 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%music3&size=300%';
UPDATE song SET cover_url = 'https://images.unsplash.com/photo-1495305379050-64540d6ee95d?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%music4&size=300%';
UPDATE song SET cover_url = 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%music5&size=300%';
UPDATE song SET cover_url = 'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%music6&size=300%';
UPDATE song SET cover_url = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%music7&size=300%';
UPDATE song SET cover_url = 'https://images.unsplash.com/photo-1481887328591-3e277f9473dc?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%music8&size=300%';
UPDATE song SET cover_url = 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%music9&size=300%';
UPDATE song SET cover_url = 'https://images.unsplash.com/photo-1574169208507-84376144848b?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%music10&size=300%';
UPDATE song SET cover_url = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%music11&size=300%';
UPDATE song SET cover_url = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%music12&size=300%';
UPDATE song SET cover_url = 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%music13&size=300%';
UPDATE song SET cover_url = 'https://images.unsplash.com/photo-1495305379050-64540d6ee95d?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%music14&size=300%';
UPDATE song SET cover_url = 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%music15&size=300%';
UPDATE song SET cover_url = 'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%music16&size=300%';
UPDATE song SET cover_url = 'https://images.unsplash.com/photo-1481887328591-3e277f9473dc?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%music17&size=300%';
UPDATE song SET cover_url = 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%music18&size=300%';
UPDATE song SET cover_url = 'https://images.unsplash.com/photo-1574169208507-84376144848b?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%music19&size=300%';
UPDATE song SET cover_url = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%music20&size=300%';

-- 歌单封面 → images.unsplash.com
UPDATE playlist SET cover_url = REPLACE(cover_url, 'https://api.dicebear.com/9.x/rings/svg?seed=', '') WHERE cover_url LIKE '%dicebear.com%rings%';
UPDATE playlist SET cover_url = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%playlist1&size=300%';
UPDATE playlist SET cover_url = 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%playlist2&size=300%';
UPDATE playlist SET cover_url = 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%playlist3&size=300%';
UPDATE playlist SET cover_url = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%playlist4&size=300%';
UPDATE playlist SET cover_url = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%playlist5&size=300%';
UPDATE playlist SET cover_url = 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%playlist6&size=300%';
UPDATE playlist SET cover_url = 'https://images.unsplash.com/photo-1484755560615-a4c64e778a6c?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%playlist7&size=300%';
UPDATE playlist SET cover_url = 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%playlist8&size=300%';
UPDATE playlist SET cover_url = 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%playlist9&size=300%';
UPDATE playlist SET cover_url = 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=300&h=300&fit=crop&crop=center' WHERE cover_url LIKE '%playlist10&size=300%';

-- app_user 头像 → ui-avatars.com
UPDATE app_user SET avatar = REPLACE(avatar, 'https://api.dicebear.com/9.x/initials/svg', 'https://ui-avatars.com/api') WHERE avatar LIKE '%dicebear.com%initials%';
UPDATE app_user SET avatar = REGEXP_REPLACE(avatar, 'seed=([^&]+)&size=200', 'name=\\1&size=200&background=589286&color=fff&bold=true&format=png') WHERE avatar LIKE '%ui-avatars.com%';

SELECT '图片链接迁移完成！' AS result;

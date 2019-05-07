CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    fstlstname varchar(128), -- 'Kyle Lowry',
    code varchar(8), -- 'F100',
    profession varchar(64), --'Drywall Installer',
    color varchar(16), --'#FF6600',
    city varchar(32), --'Brampton',
    branch varchar(64), --'Abacus',
    assigned boolean --true
);

INSERT INTO employees (id, fstlstname, code, profession, color, city, branch, assigned)
VALUES ( DEFAULT, 'Kyle Lowry', 'F100', 'Drywall Installer', '#FF6600', 'Brampton', 'Abacus', 'true'::boolean );

INSERT INTO employees (id, fstlstname, code, profession, color, city, branch, assigned)
VALUES ( DEFAULT, 'DeMar DeRozan', 'F101', 'Drywall Installer', 'yellow', 'Brampton', 'Pillsworth', 'false'::boolean );

INSERT INTO employees (id, fstlstname, code, profession, color, city, branch, assigned)
VALUES ( DEFAULT, 'Fred Van Vleet', 'F102', 'Drywall Installer', 'green', 'Bolton', 'Abacus', 'false'::boolean );

INSERT INTO employees (id, fstlstname, code, profession, color, city, branch, assigned)
VALUES ( DEFAULT, 'Jonas Valanciunas', 'F103', 'Drywall Installer', '#333333', 'Bolton', 'Pillsworth', 'true'::boolean );

INSERT INTO employees (id, fstlstname, code, profession, color, city, branch, assigned)
VALUES ( DEFAULT, 'Chris Bosh', 'F104', 'Drywall Installer', '#FF6600', 'Brampton', 'Abacus', 'true'::boolean );

INSERT INTO employees (id, fstlstname, code, profession, color, city, branch, assigned)
VALUES ( DEFAULT, 'Marcus Camby', 'F105', 'Runner', 'red', 'Brampton', 'Pillsworth', 'false'::boolean );

INSERT INTO employees (id, fstlstname, code, profession, color, city, branch, assigned)
VALUES ( DEFAULT, 'Vince Carter', 'F106', 'Runner', 'red', 'Toronto', 'Abacus', 'false'::boolean );